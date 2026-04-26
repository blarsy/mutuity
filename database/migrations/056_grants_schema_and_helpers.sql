begin;

create table if not exists app_public.grant_definition (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  awarded_token_amount integer not null check (awarded_token_amount > 0),
  max_successful_claim_count integer check (
    max_successful_claim_count is null
    or max_successful_claim_count > 0
  ),
  expires_at timestamptz,
  linked_campaign_id uuid references app_public.campaign(id) on delete set null,
  created_by_account_id uuid not null references app_public.account(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(title) <> '')
);

create table if not exists app_public.grant_target_account (
  grant_id uuid not null references app_public.grant_definition(id) on delete cascade,
  account_id uuid not null references app_public.account(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (grant_id, account_id)
);

create table if not exists app_public.grant_target_email (
  grant_id uuid not null references app_public.grant_definition(id) on delete cascade,
  target_email text not null,
  target_email_normalized text not null,
  created_at timestamptz not null default now(),
  primary key (grant_id, target_email_normalized),
  check (btrim(target_email) <> ''),
  check (btrim(target_email_normalized) <> '')
);

create table if not exists app_public.grant_claim (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references app_public.grant_definition(id) on delete cascade,
  account_id uuid not null references app_public.account(id) on delete cascade,
  awarded_token_amount integer not null check (awarded_token_amount > 0),
  token_movement_id uuid references app_public.token_movement(id) on delete set null,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (grant_id, account_id)
);

create index if not exists grant_definition_created_at_idx
  on app_public.grant_definition (created_at desc);

create index if not exists grant_definition_expires_at_idx
  on app_public.grant_definition (expires_at)
  where expires_at is not null;

create index if not exists grant_definition_campaign_idx
  on app_public.grant_definition (linked_campaign_id)
  where linked_campaign_id is not null;

create index if not exists grant_target_account_account_id_idx
  on app_public.grant_target_account (account_id);

create index if not exists grant_target_email_normalized_idx
  on app_public.grant_target_email (target_email_normalized);

create index if not exists grant_claim_account_awarded_at_idx
  on app_public.grant_claim (account_id, awarded_at desc);

create index if not exists grant_claim_grant_awarded_at_idx
  on app_public.grant_claim (grant_id, awarded_at desc);

alter table app_public.grant_definition enable row level security;
alter table app_public.grant_target_account enable row level security;
alter table app_public.grant_target_email enable row level security;
alter table app_public.grant_claim enable row level security;

drop policy if exists grant_definition_select_policy on app_public.grant_definition;
create policy grant_definition_select_policy on app_public.grant_definition
  for select
  using (app_private.is_manager());

drop policy if exists grant_definition_admin_write_policy on app_public.grant_definition;
create policy grant_definition_admin_write_policy on app_public.grant_definition
  for all
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists grant_target_account_select_policy on app_public.grant_target_account;
create policy grant_target_account_select_policy on app_public.grant_target_account
  for select
  using (app_private.is_manager());

drop policy if exists grant_target_account_admin_write_policy on app_public.grant_target_account;
create policy grant_target_account_admin_write_policy on app_public.grant_target_account
  for all
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists grant_target_email_select_policy on app_public.grant_target_email;
create policy grant_target_email_select_policy on app_public.grant_target_email
  for select
  using (app_private.is_manager());

drop policy if exists grant_target_email_admin_write_policy on app_public.grant_target_email;
create policy grant_target_email_admin_write_policy on app_public.grant_target_email
  for all
  using (app_private.is_admin())
  with check (app_private.is_admin());

drop policy if exists grant_claim_select_policy on app_public.grant_claim;
create policy grant_claim_select_policy on app_public.grant_claim
  for select
  using (
    app_private.is_manager()
    or account_id = app_private.current_account_id()
  );

drop policy if exists grant_claim_admin_insert_policy on app_public.grant_claim;
create policy grant_claim_admin_insert_policy on app_public.grant_claim
  for insert
  with check (app_private.is_admin());

grant select on app_public.grant_definition to manager, admin;
grant insert, update on app_public.grant_definition to admin;

grant select on app_public.grant_target_account to manager, admin;
grant insert, update, delete on app_public.grant_target_account to admin;

grant select on app_public.grant_target_email to manager, admin;
grant insert, update, delete on app_public.grant_target_email to admin;

grant select on app_public.grant_claim to identified_account, manager, admin;
grant insert on app_public.grant_claim to admin;

create or replace function app_private.upsert_grant_definition(
  p_grant_id uuid,
  p_title text,
  p_description text,
  p_awarded_token_amount integer,
  p_max_successful_claim_count integer default null,
  p_expires_at timestamptz default null,
  p_linked_campaign_id uuid default null,
  p_archived_at timestamptz default null
)
returns app_public.grant_definition
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_grant app_public.grant_definition;
  v_actor_account_id uuid;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_description text := btrim(coalesce(p_description, ''));
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can create or modify grants';
  end if;

  if v_title is null then
    raise exception using message = 'Grant title is required';
  end if;

  if p_awarded_token_amount is null or p_awarded_token_amount <= 0 then
    raise exception using message = 'Grant awarded token amount must be a positive integer';
  end if;

  if p_max_successful_claim_count is not null and p_max_successful_claim_count <= 0 then
    raise exception using message = 'Grant max successful claim count must be positive';
  end if;

  v_actor_account_id := app_private.current_account_id();

  if v_actor_account_id is null then
    raise exception using message = 'Administrator account context is required';
  end if;

  if p_grant_id is null then
    insert into app_public.grant_definition (
      title,
      description,
      awarded_token_amount,
      max_successful_claim_count,
      expires_at,
      linked_campaign_id,
      created_by_account_id,
      archived_at
    )
    values (
      v_title,
      v_description,
      p_awarded_token_amount,
      p_max_successful_claim_count,
      p_expires_at,
      p_linked_campaign_id,
      v_actor_account_id,
      p_archived_at
    )
    returning * into v_grant;
  else
    update app_public.grant_definition
    set
      title = v_title,
      description = v_description,
      awarded_token_amount = p_awarded_token_amount,
      max_successful_claim_count = p_max_successful_claim_count,
      expires_at = p_expires_at,
      linked_campaign_id = p_linked_campaign_id,
      archived_at = p_archived_at,
      updated_at = now()
    where id = p_grant_id
    returning * into v_grant;

    if not found then
      raise exception using message = 'Grant not found';
    end if;
  end if;

  return v_grant;
end;
$$;

create or replace function app_private.replace_grant_target_accounts(
  p_grant_id uuid,
  p_account_ids uuid[] default '{}'::uuid[]
)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_inserted integer := 0;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can modify grant targets';
  end if;

  if not exists (
    select 1
    from app_public.grant_definition gd
    where gd.id = p_grant_id
  ) then
    raise exception using message = 'Grant not found';
  end if;

  delete from app_public.grant_target_account gta
  where gta.grant_id = p_grant_id;

  insert into app_public.grant_target_account (grant_id, account_id)
  select
    p_grant_id,
    distinct_account_id
  from (
    select distinct unnest(coalesce(p_account_ids, '{}'::uuid[])) as distinct_account_id
  ) candidates
  where distinct_account_id is not null;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function app_private.replace_grant_target_emails(
  p_grant_id uuid,
  p_emails text[] default '{}'::text[]
)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_inserted integer := 0;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can modify grant targets';
  end if;

  if not exists (
    select 1
    from app_public.grant_definition gd
    where gd.id = p_grant_id
  ) then
    raise exception using message = 'Grant not found';
  end if;

  delete from app_public.grant_target_email gte
  where gte.grant_id = p_grant_id;

  insert into app_public.grant_target_email (
    grant_id,
    target_email,
    target_email_normalized
  )
  select
    p_grant_id,
    normalized_targets.target_email,
    normalized_targets.target_email_normalized
  from (
    select distinct
      nullif(btrim(raw_email), '') as target_email,
      app_private.normalize_auth_identifier(raw_email) as target_email_normalized
    from unnest(coalesce(p_emails, '{}'::text[])) raw_email
  ) normalized_targets
  where normalized_targets.target_email is not null
    and normalized_targets.target_email_normalized is not null;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function app_private.is_grant_campaign_criterion_satisfied(
  p_grant_id uuid,
  p_account_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_campaign_id uuid;
begin
  select gd.linked_campaign_id
  into v_campaign_id
  from app_public.grant_definition gd
  where gd.id = p_grant_id;

  if not found then
    raise exception using message = 'Grant not found';
  end if;

  if v_campaign_id is null then
    return true;
  end if;

  return exists (
    select 1
    from app_public.campaign_need cn
    join app_public.need n on n.id = cn.need_id
    where cn.campaign_id = v_campaign_id
      and cn.status = 'accepted'
      and n.creator_account_id = p_account_id
  )
  or exists (
    select 1
    from app_public.campaign_resource cr
    join app_public.resource r on r.id = cr.resource_id
    where cr.campaign_id = v_campaign_id
      and cr.status = 'accepted'
      and r.creator_account_id = p_account_id
  );
end;
$$;

create or replace function app_private.record_grant_claim_award(
  p_grant_id uuid,
  p_account_id uuid,
  p_awarded_token_amount integer,
  p_token_movement_id uuid default null
)
returns app_public.grant_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_claim app_public.grant_claim;
begin
  if p_awarded_token_amount is null or p_awarded_token_amount <= 0 then
    raise exception using message = 'Grant claim awarded token amount must be a positive integer';
  end if;

  insert into app_public.grant_claim (
    grant_id,
    account_id,
    awarded_token_amount,
    token_movement_id
  )
  values (
    p_grant_id,
    p_account_id,
    p_awarded_token_amount,
    p_token_movement_id
  )
  on conflict (grant_id, account_id) do update
    set grant_id = app_public.grant_claim.grant_id
  returning * into v_claim;

  return v_claim;
end;
$$;

create or replace function app_public.get_grant_for_claim(
  p_grant_id uuid
)
returns table (
  id uuid,
  title text,
  description text,
  awarded_token_amount integer,
  max_successful_claim_count integer,
  expires_at timestamptz,
  linked_campaign_id uuid
)
language plpgsql
stable
security definer
set search_path = app_public, app_private, public
as $$
begin
  if app_private.current_account_id() is null then
    raise exception using message = 'Authentication required';
  end if;

  return query
  select
    gd.id,
    gd.title,
    gd.description,
    gd.awarded_token_amount,
    gd.max_successful_claim_count,
    gd.expires_at,
    gd.linked_campaign_id
  from app_public.grant_definition gd
  where gd.id = p_grant_id
    and gd.archived_at is null;
end;
$$;

grant execute on function app_private.upsert_grant_definition(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz)
  to admin;
grant execute on function app_private.replace_grant_target_accounts(uuid, uuid[])
  to admin;
grant execute on function app_private.replace_grant_target_emails(uuid, text[])
  to admin;
grant execute on function app_private.is_grant_campaign_criterion_satisfied(uuid, uuid)
  to identified_account, manager, admin;
grant execute on function app_private.record_grant_claim_award(uuid, uuid, integer, uuid)
  to identified_account, manager, admin;
grant execute on function app_public.get_grant_for_claim(uuid)
  to identified_account, manager, admin;

comment on table app_public.grant_definition is
  'Administrator-defined token seeding grants with optional targeting and campaign criteria.';
comment on table app_public.grant_target_account is
  'Per-grant account-id targeting criteria. Empty set means no account-id restriction.';
comment on table app_public.grant_target_email is
  'Per-grant email targeting criteria using canonical lower-trimmed email values.';
comment on table app_public.grant_claim is
  'Per-account successful claim records for grants, enforcing one successful award per grant/account.';

comment on function app_private.upsert_grant_definition(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz) is
  'Creates or updates a grant definition with admin-only authorization checks.';
comment on function app_private.replace_grant_target_accounts(uuid, uuid[]) is
  'Replaces account-id targeting criteria for a grant in one operation.';
comment on function app_private.replace_grant_target_emails(uuid, text[]) is
  'Replaces email targeting criteria for a grant in one operation using normalized email matching.';
comment on function app_private.is_grant_campaign_criterion_satisfied(uuid, uuid) is
  'Returns whether an account satisfies the optional linked-campaign criterion for a grant.';
comment on function app_private.record_grant_claim_award(uuid, uuid, integer, uuid) is
  'Records an awarded grant claim with idempotent per-grant/per-account behavior.';
comment on function app_public.get_grant_for_claim(uuid) is '@name getGrantForClaim';

revoke all on function app_private.upsert_grant_definition(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz) from public;
revoke all on function app_private.replace_grant_target_accounts(uuid, uuid[]) from public;
revoke all on function app_private.replace_grant_target_emails(uuid, text[]) from public;
revoke all on function app_private.is_grant_campaign_criterion_satisfied(uuid, uuid) from public;
revoke all on function app_private.record_grant_claim_award(uuid, uuid, integer, uuid) from public;

commit;
