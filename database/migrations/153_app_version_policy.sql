begin;

-- App version floor policy.
--
-- The minimum supported mobile-app version is stored server-side (NOT in the
-- app bundle) so that a breaking backend/database change can force clients
-- below a given version to update. The floor is bumped atomically in the same
-- migration that introduces the breaking schema change.
--
-- Semver strings follow `major.minor.patch`; the backend compares them
-- numerically per segment (see backend/src/postgraphile/version.ts), and the
-- mobile app surfaces the same value through the `appVersionPolicy` query.

create table if not exists app_private.app_version_policy (
  id boolean primary key default true check (id),
  min_ios_semver text not null,
  min_android_semver text not null,
  updated_at timestamptz not null default now()
);

-- Single row; enforce via the primary key singleton (id is always true).
insert into app_private.app_version_policy (id, min_ios_semver, min_android_semver)
values (true, '0.1.0', '0.1.0')
on conflict (id) do nothing;

-- Expose the floor through a stable SQL function so PostGraphile surfaces it
-- as the `appVersionPolicy` GraphQL query (available to every role including
-- `anonymous`, since the update-required gate runs before authentication).
create or replace function app_public.app_version_policy()
returns table (min_ios_semver text, min_android_semver text)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select p.min_ios_semver, p.min_android_semver
  from app_private.app_version_policy p
  where p.id = true
$$;

comment on function app_public.app_version_policy() is
  '@name appVersionPolicy';

grant execute on function app_public.app_version_policy()
  to anonymous, identified_account, admin;

commit;