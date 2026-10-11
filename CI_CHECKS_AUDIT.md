# CI checks audit (2026-10-11)

All three checks remain useful. None was removed or made non-blocking.
The public GitHub run summaries confirm the reported failures, but detailed
job logs require sign-in; the causes below were reproduced locally.

## Mobile Typecheck

- Clean installation failed before compilation: the mobile lockfile was missing
  auto-installed Storybook web peers. Resolving an unpinned React DOM peer chose
  a version incompatible with the app's React 19.0.0. Pin the development peer
  to React DOM 19.0.0 and regenerate the lockfile.
- Once dependencies were present, GraphQL generation passed but strict TypeScript
  reported 29 diagnostics. Fixed optional-value handling, obsolete picker props,
  image-result guards, translation helper types, incomplete stories, and test mocks.
  Tests/stories remain included and strict compiler settings are unchanged.
- The drift check omitted the current operation artifact,
  `mobile-app/src/services/graphql/operations.generated.ts`; it now checks all
  three generated files.
- The workflow now uses Node 22 (codegen dependencies require >=22.13.0) and
  Node-24-compatible checkout/setup actions.

## SQL Database Quality

The entire migration history applied to an empty PostgreSQL 16 database.
`plpgsql_check` then found three errors:

1. `register_local_account`: ambiguous identifier-availability helper overload.
2. `register_local_account_with_social_identity`: the same ambiguity.
3. `respond_to_resource_bid`: an unqualified `status` column conflicted with
   the function parameter in the expired-resource branch.

Migration 149 introduced a defaulted two-argument helper without removing the
old one-argument function. Migration 162 removes the obsolete overload without
CASCADE and preserves the self-exclusion-aware helper. It also qualifies the
bid column and fixes the idempotent response returning an expanded context
record instead of the declared resource-bid row type.

Canonical SQL and the new append-only migration are kept in sync. Existing
migrations, public argument names, GraphQL smart names and surviving grants
are unchanged. Deploy migration 162 to fix running databases; verification
here used a disposable database, not the development database.

Two non-blocking warnings remain: `normalize_profile_links` is marked IMMUTABLE
but contains a STABLE expression, and `request_email_verification` has an unused
variable. Neither was suppressed.

## SQL Boundary

The remaining violation was the raw multiline app-version policy query in
`backend/src/postgraphile/version.ts`. The backend now invokes the existing
`app_public.app_version_policy()` function, preserving result aliases, caching
and bootstrap fallback.

The scanner uses Node built-ins only. Removed the unnecessary root `npm ci`
and npm cache setup, so this architecture guard no longer installs the web and
backend dependency trees before scanning. This is an architecture convention
check, not a substitute for database privilege/RLS verification.

## Verification

- Mobile `npm ci --dry-run`: passes after the peer/lockfile repair.
- Real clean `npm ci` and full mobile typecheck in Linux with Node 22: pass.
- Full mobile schema generation, operation codegen and strict typecheck: pass.
- Generated artifact drift: clean.
- SQL boundary: passes, with the original rules unchanged.
- Fresh PostgreSQL 16 migration history and PL/pgSQL guard: pass, zero errors.
- Backend strict typecheck: passes.
- Version-function unit regressions: 2 pass.
- Registration/database-quality rollback regressions: 20 pass across two suites.
- Final fresh-database quality/email-boundary/version regression run: 29 pass.
- Focused mobile regressions: 38 pass across ten suites. A broader mobile test
  selection retained the same failures as untouched HEAD; this audit does not
  claim the entire mobile Jest suite is green.

The database regression suite requires an explicit disposable
`TEST_DATABASE_URL`; its fixtures and side effects roll back.