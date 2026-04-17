---
title: Verification as Product
---

# Verification as Product

Most template vendors ship the artifact. We ship the artifact **and** the verification layer around it.

## What each template includes

- **e2e tests** that exercise the template as an external user would: install, run, send a tool call, assert the response shape.
- **Pack-time hygiene**: we verify `_gitignore → .gitignore` rename, `engines` field, no stray build artifacts, no fixture pollution between test runs.
- **Cross-model QA**: before release we run the diff through a second model (Codex) to catch same-model bias. This has historically caught issues our Claude-side QA missed.

## Why this is part of the product

Any template can _appear_ to work on the happy path. We publish the QA harness alongside the template so buyers can see _how_ we verified it, not just _that_ we verified it. The transparency is part of the trust signal.

## Related

- [Design Principles](/principles/)
- [Decisions as Templates](/principles/decisions-as-templates)
