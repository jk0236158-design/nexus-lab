# Deploying to Google Cloud Run

This service is a single stateless web container that binds `0.0.0.0:$PORT`, which
is the Cloud Run contract. It has no runtime dependencies (Node standard library
only) and no database. These steps describe a standard deploy; replace every
`<...>` placeholder with your own values.

## Prerequisites

- A Google Cloud project with billing enabled.
- The `gcloud` CLI installed and authenticated (`gcloud auth login`).
- A region, e.g. `<REGION>` such as `us-central1` or `asia-northeast1`.

## Enable the required APIs

```
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  generativelanguage.googleapis.com \
  --project <PROJECT_ID>
```

`generativelanguage.googleapis.com` is the Gemini API used by the enrichment step.
If you instead route Gemini through Vertex AI, enable `aiplatform.googleapis.com`
and supply the corresponding key/credentials.

## Deploy from source

Cloud Run can build the container from the included `Dockerfile`:

```
gcloud run deploy evidence-ledger \
  --source . \
  --region <REGION> \
  --project <PROJECT_ID> \
  --allow-unauthenticated \
  --port 8080
```

Cloud Run injects `PORT`; the server reads it and binds `0.0.0.0`. The container
does not need a build step beyond `npm install` (which installs nothing, as there
are no runtime dependencies).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | injected by Cloud Run | Port to bind. Defaults to `8080` locally. |
| `GEMINI_API_KEY` | optional | Enables the Gemini-backed enrichment. If unset, the service uses a deterministic local fallback and still runs. |

Set the Gemini key without baking it into the image by using a Secret Manager
reference:

```
# store the key once
echo -n "<YOUR_GEMINI_API_KEY>" | gcloud secrets create gemini-api-key \
  --data-file=- --project <PROJECT_ID>

# grant the Cloud Run runtime service account access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member "serviceAccount:<RUNTIME_SERVICE_ACCOUNT>" \
  --role roles/secretmanager.secretAccessor \
  --project <PROJECT_ID>

# wire it into the service
gcloud run services update evidence-ledger \
  --region <REGION> \
  --project <PROJECT_ID> \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

## Minimal permissions

- Deploying account: `roles/run.admin` (deploy the service) and
  `roles/iam.serviceAccountUser` (act as the runtime service account). Source
  deploys also use Cloud Build (`roles/cloudbuild.builds.editor`).
- Runtime service account: no special roles are required for the core service.
  If you use a Gemini key from Secret Manager, add
  `roles/secretmanager.secretAccessor` scoped to that one secret.
- Prefer a dedicated, non-default runtime service account with only the roles
  above rather than the default Compute service account.

## Health check

The container serves `GET /healthz` and `GET /health` (both return
`{"status":"ok"}`). Cloud Run can use `/healthz` as the startup/liveness probe
(those probes hit the container directly). When checking through the public
`*.run.app` URL, use `/health`: Google's frontend intercepts `/healthz` on that
domain and returns its own 404 before the request reaches the container.

## Verify after deploy

```
SERVICE_URL=$(gcloud run services describe evidence-ledger \
  --region <REGION> --project <PROJECT_ID> --format 'value(status.url)')

curl -s "$SERVICE_URL/health"
curl -s "$SERVICE_URL/api/cases"
curl -s -X POST "$SERVICE_URL/api/recheck" \
  -H 'content-type: application/json' -d '{"advance_hours": 7}'
```

The recheck call should show the stale case flipping to `stale_after_recheck`
while the others stay unchanged.

## Notes

- The service is stateless and holds the synthetic cases in memory; restarts and
  new instances simply re-seed the same synthetic data.
- No private data, credentials, or production claims are sent anywhere. With a
  Gemini key set, only synthetic claim text and the local verdict are included in
  the model prompt.
