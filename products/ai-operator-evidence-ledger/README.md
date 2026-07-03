# AI Operator Evidence Ledger

A narrow control layer that checks whether an AI operator's "done" claim is backed
by proof now, and rechecks whether the claim stays connected to a next action after
a review window passes.

## Problem

AI agents can write "done", "committed", or "deployed" while the actual artifact,
test result, or follow-up state does not exist. A harder failure is temporal: a
claim can look true when written, then decay into disconnected text by the next
run. Treating a completion claim as final the moment it is spoken hides both
failure modes.

## Solution

This service turns each done-claim into a small case that must stay attached to
evidence, a decision, and a next action over time:

1. **Intake** normalizes a raw claim into a canonical case schema. Unknown evidence
   requirements are dropped rather than trusted, so an agent cannot smuggle in a
   check the engine does not actually run.
2. **Verification** runs a fixed set of checks for the requirements a claim
   declares and resolves a verdict.
3. **AI enrichment** (Google Gemini) classifies the claim, suggests evidence types
   that would strengthen it, and writes a plain-language, public-safe summary of
   why a claim is not backed. This step is key-optional: with no key it uses a
   deterministic local fallback so the service still runs.
4. **Timed recheck** re-runs verification after the clock advances, so a claim that
   was green when written can flip to stale instead of staying permanently green.

This is a synthetic demo. The sample cases are illustrative examples of operating
failure modes, not real work logs, customer data, or credentials.

## Demo flow

Three synthetic cases, visible on the dashboard at `/`:

- `claim-happy-readme-tests` -> `evidence_backed`. Artifact present, content marker
  found, recorded passing test, linked decision, visible next action, and within
  its review window: all checks pass.
- `claim-missing-artifact` -> `rejected_missing_proof`. The referenced build
  artifact does not exist, so a repair action is generated and the done state is
  withheld.
- `claim-stale-next-action` -> `evidence_backed` on first check, then
  `stale_after_recheck` once its 6-hour review window elapses.

The recheck is the point of the demo. A claim that was green when written flips to
stale after time passes:

```
curl -s -X POST http://localhost:8080/api/recheck \
  -H 'content-type: application/json' \
  -d '{"advance_hours": 7}'
```

This advances the clock 7 hours: the stale case (6-hour window) flips to
`stale_after_recheck` while the happy case (24-hour window) stays
`evidence_backed`.

## How verification works

Intake normalizes a raw claim into the canonical case schema:

```
claim_id, agent_name, claimed_outcome, artifact_ref, evidence_requirements,
decision_ref, risk_level, next_action_ref, review_window_hours, status, repair_action
```

The engine runs a fixed set of checks for the requirements a claim declares:

- `artifact_exists` - the referenced artifact file is present.
- `artifact_content_match` - the artifact contains the expected proof marker.
- `test_pass_recorded` - a recorded passing test result exists alongside the artifact.
- `decision_link_present` - the claim links to a governing decision.
- `next_action_visible` - a next action is attached; the claim does not dead-end.
- `recency_within_window` - the claim is still within its review window.

Verdict resolution:

- any non-recency check fails -> `rejected_missing_proof` (never had proof) and a
  repair action is generated;
- only recency fails -> `stale_after_recheck` (was true, decayed over time);
- otherwise -> `evidence_backed`.

## AI enrichment (Google Gemini)

After a case is verified, an enrichment step adds:

- `classification` - a short label for the kind of claim (for example
  `build_artifact`, `doc_update`, `review_followthrough`);
- `suggested_evidence_types` - checks (from the fixed set above) that would
  strengthen the claim;
- `failure_summary` - one plain-language, public-safe sentence about why a claim is
  not backed.

Implementation:

- When `GEMINI_API_KEY` is set, the service calls the Gemini REST endpoint
  (`generativelanguage.googleapis.com`, model `gemini-2.5-flash`) with a hard
  timeout, using the standard `fetch` API as a thin adapter (no SDK dependency).
- On any failure - no key, network error, timeout, or unparsable output - it falls
  back to a deterministic local function with the same output shape. The service
  runs and the tests pass with no key and no network.
- Each case reports a `source` of `gemini` or `local-fallback` so the dashboard and
  API show which path produced the result. The model's suggested evidence types are
  filtered to the known check set, so the model cannot inject a check the engine
  does not run.
- Only synthetic claim text and the local verdict are included in the prompt. No
  private data is sent.

Trigger an enrichment pass over all cases:

```
curl -s -X POST http://localhost:8080/api/enrich
```

## Architecture

```
        HTTP (Cloud Run)
               |
        node:http server  ──>  dashboard (server-rendered HTML)
               |
   intake ──> verification engine ──> AI enrichment ──> timed recheck
 (normalize)   (six fixed checks)    (Gemini | local)   (advance clock)
               |
        in-memory case ledger (synthetic data)
```

A single stateless web service binds `0.0.0.0:$PORT`. The container is built from
the included `Dockerfile` (`node:20-slim`, no build step). `GET /healthz` serves as
the Cloud Run probe; use the `GET /health` alias when checking through a public
`run.app` URL, because Google's frontend intercepts `/healthz` there and returns
its own 404 before the request reaches the container. Deployment steps are in
[DEPLOY.md](DEPLOY.md).

## Google Cloud components used

- **Cloud Run** - hosts the single stateless web service (`0.0.0.0:$PORT`,
  `/healthz` probe internally, `/health` via the public URL, `Dockerfile`-based
  deploy).
- **Gemini API** (`generativelanguage.googleapis.com`) - the AI enrichment step
  (claim classification, suggested evidence, public-safe failure summary).
- **Secret Manager** (optional) - holds `GEMINI_API_KEY` so it is not baked into
  the image (see [DEPLOY.md](DEPLOY.md)).
- **Cloud Build / Artifact Registry** - used implicitly by `gcloud run deploy
  --source .` to build and store the container image.

## Run locally

```
npm install
npm start
```

Then open http://localhost:8080 for the dashboard. The port is configurable with
the `PORT` environment variable (Cloud Run convention). `npm install` pulls no
runtime dependencies; the service uses only the Node standard library, so it also
runs with a bare `node src/server.js`.

To enable real Gemini calls locally, set the key first:

```
GEMINI_API_KEY=<your-key> npm start
```

Without it, the service starts and runs on the local fallback.

## Run the tests

```
npm test
```

The suite covers each of the six checks, the three demo case verdicts, the timed
recheck that flips a previously green claim to stale, and the Gemini enrichment
adapter (fallback paths and output normalization, using a mock fetch - no real API
key is required).

## HTTP surface

- `GET /` - dashboard with the three cases, their verdicts, per-check proof
  summary, and the AI enrichment for each case.
- `GET /healthz` - liveness probe (container-internal; Google's frontend
  intercepts this path on public `run.app` URLs).
- `GET /health` - same probe, reachable through the public `run.app` URL.
- `GET /api/cases` - all case summaries as JSON (including enrichment).
- `GET /api/cases/:id` - one case summary.
- `POST /api/claims` - intake a new raw claim (normalize, store, check).
- `POST /api/check` - run a verification pass over all cases.
- `POST /api/recheck` - timed recheck. Body `{ "advance_hours": 7 }` advances the
  clock to demonstrate a case going stale once its review window is exceeded.
- `POST /api/enrich` - re-run the Gemini-backed enrichment (or local fallback) over
  all cases.

## Boundaries

- Synthetic data only. No private logs, credentials, customer data, or production
  claims.
- This is a reliability/governance demo, not a replacement for CI, security policy,
  or evals, and not a claim of full autonomy or production adoption.
- The Gemini enrichment is advisory: verdicts come from the deterministic engine,
  not from the model.

## Tooling note

Parts of this project were built with coding agents (Claude Code / Codex).
