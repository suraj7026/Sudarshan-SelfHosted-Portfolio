# Publication verification — 2026-10-28

Branch: `migration/image-publication`. Published source:
`41645c3ce1ef13d29bec8cce88b476c4da281e45`.
Successful run: https://github.com/suraj7026/Sudarshan-SelfHosted-Portfolio/actions/runs/40710972189

## Published candidates

```text
ghcr.io/suraj7026/portfolio-frontend@sha256:5b62ac68295378b149d01d39446cc3d0b490fe7332f08a0b1c7788be2c43b5e5
ghcr.io/suraj7026/portfolio-backend@sha256:42d5aee0517bdbc23ed4fc4e6b6743ea60dfd03bc4b4f39f2bf48f8265e28cbb
ghcr.io/suraj7026/portfolio-gateway@sha256:43764066cecec990596adbe8da6c3dc5490ff5d9e9d752df2cfeba719ee9f815
ghcr.io/suraj7026/portfolio-resume-worker@sha256:1e287973dfeeee2e4bd9ae9c49c07dea14b5e9f63f0ad63dbae3ac39e0b29e0c
```

Tags are `candidate-<source-commit>`. No existing latest/production tag was changed.
All four image manifests were verified as anonymously accessible from the main
server using an isolated empty Docker credential directory. Package visibility was
not manually changed. Full image runtime checks below occurred on a disposable
GitHub runner, not as new production workloads.

## Passed checks

- All four images built with allowlisted, environment-file-excluding contexts.
- Frontend locked dependency installation and build; backend compile/test/vet.
  Backend had no existing Go test files, so do not count that command as test coverage.
- Actual non-root web containers, read-only filesystems, dropped capabilities and
  bounded resources, on an internal Docker network with synthetic PostgreSQL data.
- Frontend HTML/JS bundle; five database-backed API endpoints; featured-project
  filtering; gateway image-path mapping against an Nginx MinIO fixture.
- ResumeAgent import without creating an agent, followed by four offline health/
  webhook filtering/queuing tests with networking disabled. Queued tasks were never
  executed; no live second worker, real upload, production DB or AI request was used.
- Non-root identity and absent embedded `.env` checks for every runtime image.
- Publication completed only after all checks passed.

## Failures investigated and corrected

1. Run 40709178674 failed at npm ci because the existing lockfile omitted an optional
   yaml@2.9.1 peer entry. Regenerating with the pinned Node/npm environment added one
   17-line lock entry, with no changes to existing dependency versions. npm ci was
   retained; no fallback to unlocked installation was introduced.
2. Runs 40709524859 and 40710217226 failed waiting on the published loopback port of
   an internal Docker network. Diagnostics showed healthy internal containers and
   a successful DB-backed request between containers, but host connection refusal.
   The probe client now runs inside the same internal network, retaining isolation
   and all assertions. No networking protection or readiness gate was disabled.

## SSH baseline and remaining scope

Both K3s nodes Ready. All original production container image IDs/start times remained
unchanged; all eight relevant containers remain running. Cloudflare, MinIO, Ollama and
PostgreSQL services remained active. Public Thirty health, Drive login and Portfolio
profile checks passed; the existing resume health endpoint returned 200. These checks
do not resolve the previously observed MinIO container/worker connectivity failures.

No new Portfolio process was started on the server. No database, object, webhook,
public route, Kubernetes workload, storage or deployment pipeline was migrated.
Production deploy workflow did not run; latest run remains 24983798000 from 2026-04-27.
The candidate changes still need review before merging because a main push would
trigger the existing broad Compose deployment.

## Urgent independent security finding

The public repository's tracked `backend/.env` DATABASE_URL contains both username
and password components and is not an obvious placeholder. Values were not printed,
used for tests or included in image build contexts. Treat the credentials as exposed:
arrange a coordinated credential rotation/revocation and repository-history cleanup.
Do not assume deleting the file from a new commit revokes existing copies. Credential
changes were not made automatically because the running applications depend on them.

Actual document processing, webhook retries/idempotency/draining, production schema
compatibility, live MinIO operations, pod networking, resource sizing, graceful
rollout/rollback and production cutover are still pending. Resume dependencies also
remain unpinned, despite the published runtime images having immutable digests.
