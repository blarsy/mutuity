begin;

-- Backfill legacy rows so expiration can become required for all grants.
update app_public.grant_definition
set expires_at = now() + interval '365 days'
where expires_at is null;

alter table app_public.grant_definition
  alter column expires_at set not null;

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

  if p_expires_at is null then
    raise exception using message = 'Grant expiration datetime is required';
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

drop function if exists app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz);

create or replace function app_public.upsert_grant(
  p_grant_id uuid,
  p_title text,
  p_description text,
  p_awarded_token_amount integer,
  p_max_successful_claim_count integer default null,
  p_expires_at timestamptz default null,
  p_linked_campaign_id uuid default null,
  p_archived_at timestamptz default null,
  p_target_account_ids uuid[] default null,
  p_target_emails text[] default null
)
returns app_public.grant_definition
language plpgsql
set search_path = app_public, app_private, public
as $$
declare
  v_admin_account_id uuid;
  v_result app_public.grant_definition;
  v_is_create boolean;
  v_has_any_targeting boolean;
begin
  v_admin_account_id := app_private.current_account_id();
  v_is_create := p_grant_id is null;

  v_result := app_private.upsert_grant_definition(
    p_grant_id,
    p_title,
    p_description,
    p_awarded_token_amount,
    p_max_successful_claim_count,
    p_expires_at,
    p_linked_campaign_id,
    p_archived_at
  );

  if p_target_account_ids is not null then
    perform app_private.replace_grant_target_accounts(v_result.id, p_target_account_ids);
  end if;

  if p_target_emails is not null then
    perform app_private.replace_grant_target_emails(v_result.id, p_target_emails);
  end if;

  select (
    exists (select 1 from app_public.grant_target_account gta where gta.grant_id = v_result.id)
    or exists (select 1 from app_public.grant_target_email gte where gte.grant_id = v_result.id)
  ) into v_has_any_targeting;

  if p_max_successful_claim_count is null
    and p_linked_campaign_id is null
    and not v_has_any_targeting then
    raise exception using message =
      'Grant must define at least one constraint: max successful claim count, linked campaign, account whitelist, or email whitelist';
  end if;

  if v_is_create then
    perform app_private.write_operational_log(
      'info',
      'web_api',
      format('[admin] grant created: grant_id=%s title=%s by account_id=%s', v_result.id, p_title, v_admin_account_id),
      'upsert_grant',
      v_admin_account_id
    );
  end if;

  return v_result;
end;
$$;

grant execute on function app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz, uuid[], text[])
  to admin;

comment on function app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz, uuid[], text[])
  is '@name upsertGrant
Creates a new grant definition when p_grant_id is null, or updates an existing one. Admin only.';

commit;
