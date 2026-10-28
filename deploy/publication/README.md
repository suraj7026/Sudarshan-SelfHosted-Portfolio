# Portfolio candidate publication

Publication-only branch: `migration/image-publication`. The existing main-push
production workflow is unchanged. Do not merge this branch to main without a separate
production-deployment review: any main push currently triggers Compose deployment.
No production containers, routes, data, webhook targets or Kubernetes resources are
changed by this workflow. Outpost is excluded.

## Images and isolated checks

The workflow builds four non-root candidate images with digest-pinned base images:
frontend, backend, gateway and resume-worker. It publishes only commit-qualified
candidate tags after all checks pass; it never changes `latest`.

- Frontend uses locked npm dependencies and same-origin API paths, without loading
  the tracked frontend environment file. Build/runtime port is 8080.
- Backend compiles only Go sources, runs go test/vet, and executes as UID 10001.
  There were no existing Go test files; the meaningful runtime checks use a disposable
  fixture database and all five public API endpoints, including featured filtering.
- Gateway uses port 8080 and named frontend/backend/MinIO upstreams. The image route
  changes from the Docker-host-only 172.17.0.1 address to `minio:9000`, which must be
  mapped to the existing host service during a separately approved migration.
  The CI MinIO endpoint is only an Nginx fixture, not production object storage.
- Resume worker imports and webhook filtering/queuing are tested with Docker
  `--network none`. Tasks are never executed, no agent is instantiated, and no second
  live webhook consumer runs. No production AI key, DB connection or object is used.
  Python 3.12 is a deliberate candidate-only upgrade from the existing Python 3.10
  image; full document-processing compatibility remains unverified.

The web tier runs only on a disposable GitHub-hosted runner in an internal network,
with a disposable PostgreSQL database. The fixture SQL is not a migration and must
never be applied to production. Real uploads, AI processing, object persistence,
webhooks, drain/retry/idempotency and production rollback remain unverified.

## Secret isolation and security finding

This public repository already tracks `.env` files. `backend/.env` contains a
populated DATABASE_URL that is not an obvious placeholder. Its value has not been
printed or copied into the new artifacts. Treat it as a potential credential exposure
and review/rotate affected credentials with a coordinated production update; removing
a file from the latest commit would not erase repository history. No credentials
were changed automatically.

Every publication Dockerfile uses explicit COPY paths and a Dockerfile-specific
allowlist that excludes environment files, key files, metadata and unrelated content.
The original Dockerfiles and tracked environment files are not used as build inputs
and are not edited. Runtime tests check for embedded .env files. Original dependency
requirements for the resume worker remain unpinned: immutable image digests identify
these artifacts, but dependency locking is still required for reproducible rebuilds.

## Remaining migration blockers

Resolve existing MinIO connectivity failures from containers/the second node,
verify PostgreSQL access rules for pod traffic, provision scoped registry pulls,
measure workload resources, establish functional probes/graceful shutdown and a
known-good rollback image, and prove webhook duplicate/retry safety. Do not start
Umami or its declared database merely because they appear in the old Compose file.
Keep PostgreSQL, MinIO, Ollama, uploads and all data on the existing hosts initially.

No Kubernetes manifests are applied by this publication-only workflow. A successful
publication is not a successful migration. Inspect the run using `gh run list` and
`gh run watch` on this branch; digests appear as PUBLISHED_IMAGE in successful logs.
