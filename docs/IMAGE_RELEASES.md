# Manual image releases and spending controls

The **Publish release images (manual)** workflow builds on standard Ubuntu
`linux/amd64` runners and publishes to GHCR. It never deploys, changes mobile
candidate routing, or builds automatically on push/PR/schedule. The existing
[local build-first procedure](../RELEASING.md#build-first-server-deployments)
remains available without registry access.

## First-time GitHub setup

1. In the repository **owner's** Billing and licensing settings, check included
   Actions usage and existing consumption across repositories. Configure an
   Actions budget with **Stop usage when budget limit is reached** enabled,
   plus alerts. Choose the paid overage you accept (including zero if supported
   by the account's controls). Verify which products/SKUs it covers. A
   notification-only budget does not cap spend. This is an account-level step;
   repository YAML cannot create or enforce a monetary billing cap. See current
   [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
2. Create GitHub Environments named exactly `test`, `review`, and `prod`.
   Restrict publishing branches/tags and configure required reviewers where
   available, especially for `prod`. Only run trusted committed code: builds
   and workflow scripts execute repository code with publishing access.
3. In each Environment, create a **variable**, `FRONTEND_BUILD_CONFIG`, containing
   a JSON object of that environment's public frontend settings. Example:

   ```json
   {
     "NEXT_PUBLIC_GRAPHQL_URL": "https://review.tope-la.com/graphql",
     "NEXT_PUBLIC_GRAPHQL_WS_URL": "wss://review.tope-la.com/graphql",
     "NEXT_PUBLIC_BACKEND_URL": "https://review.tope-la.com",
     "NEXT_PUBLIC_DEFAULT_LOCALE": "fr",
     "NEXT_PUBLIC_CLOUDINARY_CLOUD": "",
     "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET": "",
     "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": "",
     "NEXT_PUBLIC_SENTRY_DSN": ""
   }
   ```

   Use the actual URLs/settings from the matching server environment, not this
   example for every target. Production web URLs normally include `/api` as
   documented in the runbook. All public arguments in the frontend Dockerfile
   are accepted except `NEXT_PUBLIC_SENTRY_RELEASE`, which CI sets to the full
   commit SHA. Defaults: locale `fr`, empty optional integrations, trace rate
   `0.01`, monitoring environment `test`/`review`/`production`. Never add secrets,
   credentials in URLs, or server env files. The helper rejects unknown fields
   and missing HTTPS/WSS URLs before expensive builds. Backend-only publishing
   does not need this variable. Native/mobile configuration is unaffected.
4. Ensure Actions can publish packages with the repository `GITHUB_TOKEN`.
   No PAT or server SSH secret is needed in CI. GHCR initially creates private
   packages: verify backend/frontend package visibility and repository access
   after the first publish, including pre-existing package permissions. Do not
   make packages public just to simplify authentication.
5. On each server, sign Docker into GHCR directly using a dedicated classic PAT
   with `read:packages` and access to these private packages (SSO authorization
   if required). Use the server's secure credential handling; never put the
   token in Git, release manifests, or chat. Confirm server CPU architecture is
   **amd64**. ARM images/emulated builds are not enabled.

## Publish only what is needed

In Actions, select **Publish release images (manual) → Run workflow**, choose the
trusted branch/tag, one environment and `all`, `backend`, or `frontend`. Start
with test. Backend includes the worker: both services use the exact same digest.
There is deliberately no three-environment matrix. Publish additional frontend
environments only when needed. Backend images are environment-independent;
frontend images are not.

Each job has a **40-minute timeout**. A newer run for the same environment
cancels the older one, even across branches. Already consumed runner time remains
billable; different environments can run concurrently. Cancellation/failure can
leave partial images: deploy only manifests from **successful** runs. Unique
run/attempt tags and digest references keep existing deployments unaffected.

The job runs deployment/artifact regressions plus compilation/type/lint checks
performed by image builds. It does not duplicate full application/DB/e2e suites:
require relevant quality workflows and review to be green for the **same commit**
before deployment. Publishing is not approval.

BuildKit layer caches use Actions' cache service, including intermediate builder
layers so unchanged dependency installs can be reused, with separate
backend/per-environment frontend scopes. Leave the repository cache
limit at its included allowance; do not enable paid expansion without review.
Eviction can make builds cold. Local npm/Next cache mounts are **not** automatically
exported/restored on ephemeral runners. A warm build may still compile. Source-map
export uses the same builder and arguments as the published frontend.

Measure cold/warm **total job minutes**, including uploads and reruns, in Actions
and billing before increasing frequency. Only one selected environment and one
runner are used per run; there is no automatic retry.

## Artifacts and retention

Successful runs produce two separately retained artifacts:

- `release-<environment>-<run>-<attempt>`: small release manifest with full
  commit, target environment, and immutable image references; **14 days**.
  The manifest is also in the job summary. Retain deployment records securely
  beyond this window if needed for rollback.
- `private-maps-<environment>-<run>-<attempt>`: frontend client maps and manifest;
  **7 days**. Archive/upload them to private monitoring **before expiry** if
  needed for long-lived releases. They match this exact build, not a local
  rebuild. Access follows repository artifact permissions: on a public repo
  they are not private. Frontend publishing is blocked on public repositories
  until a private artifact destination is implemented.

No maps are included in the small deployment manifest. Docker build-record
artifact uploads are disabled. Runtime frontend public maps are still purged.

## Deploy a successful release

Copy the downloaded manifest to an ignored location such as
`.release-artifacts/review/release.env` (or outside the checkout). On the server,
check out its exact commit and keep the checkout clean, including no untracked
migrations. Keep live env files ignored. Then:

```bash
bash scripts/deploy-stack.sh review --images .release-artifacts/review/release.env
```

For selectively published releases, select only those services:

```bash
bash scripts/deploy-stack.sh review --images .release-artifacts/review/release.env backend worker
bash scripts/deploy-stack.sh prod --images .release-artifacts/prod/release.env frontend
```

The script parses the manifest as data (never executes it), checks its target and
commit against the clean checkout, pulls selected images while services run,
and checks image commit labels and the frontend environment label **before**
starting PostgreSQL or migrating. Mutable tags/missing selected images fail
closed. The image Compose override supplies image references; this path never
calls build. Base build definitions remain for local-mode compatibility.
Missing unselected images use an unused placeholder and are never started by
this selective path; do not use the override manually for a blanket `up`.

Migrations still come from the matching server checkout. Runtime `SENTRY_RELEASE`
is set to the release commit for correlation. Frontend public values come from
CI, not from changing the server env after compilation. Keep server public
settings consistent for manual-mode fallback. Verify maps/uploads, health,
GraphQL/WebSocket, OAuth, worker registration and production sign-in.

The same migration/cutover/readiness safeguards and rollback limitations apply
as for local builds. Candidate routing/promotion remains separate. Deploying a
previous image is not a database rollback; use a compatible recovery plan.

GHCR image storage/bandwidth is currently free, but Actions compute, caches and
artifacts have separate policies. No automatic GHCR deletion is enabled: retain
deployed digests/rollback images and review older failed/unneeded run tags
periodically. Never delete an image needed for deployment/rollback.