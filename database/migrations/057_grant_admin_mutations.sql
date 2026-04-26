begin;

-- Expose upsert_grant_definition as a PostGraphile mutation callable by admin.
-- Passing a null p_grant_id creates a new grant; passing an existing UUID updates it.
create or replace function app_public.upsert_grant(
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
set search_path = app_public, app_private, public
as $$
begin
  return app_private.upsert_grant_definition(
    p_grant_id,
    p_title,
    p_description,
    p_awarded_token_amount,
    p_max_successful_claim_count,
    p_expires_at,
    p_linked_campaign_id,
    p_archived_at
  );
end;
$$;

grant execute on function app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz)
  to admin;

comment on function app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz)
  is '@name upsertGrant
Creates a new grant definition when p_grant_id is null, or updates an existing one. Admin only.';

-- Expose replace_grant_target_accounts as a PostGraphile mutation.
create or replace function app_public.set_grant_target_accounts(
  p_grant_id uuid,
  p_account_ids uuid[] default '{}'::uuid[]
)
returns integer
language plpgsql
set search_path = app_public, app_private, public
as $$
begin
  return app_private.replace_grant_target_accounts(p_grant_id, p_account_ids);
end;
$$;

grant execute on function app_public.set_grant_target_accounts(uuid, uuid[])
  to admin;

comment on function app_public.set_grant_target_accounts(uuid, uuid[])
  is '@name setGrantTargetAccounts
Replaces the full set of account-id targeting criteria for a grant. Admin only.';

-- Expose replace_grant_target_emails as a PostGraphile mutation.
create or replace function app_public.set_grant_target_emails(
  p_grant_id uuid,
  p_emails text[] default '{}'::text[]
)
returns integer
language plpgsql
set search_path = app_public, app_private, public
as $$
begin
  return app_private.replace_grant_target_emails(p_grant_id, p_emails);
end;
$$;

grant execute on function app_public.set_grant_target_emails(uuid, text[])
  to admin;

comment on function app_public.set_grant_target_emails(uuid, text[])
  is '@name setGrantTargetEmails
Replaces the full set of email targeting criteria for a grant using normalized matching. Admin only.';

-- Convenience mutation to archive a grant (sets archived_at = now()).
create or replace function app_public.archive_grant(
  p_grant_id uuid
)
returns app_public.grant_definition
language plpgsql
set search_path = app_public, app_private, public
as $$
begin
  return app_private.upsert_grant_definition(
    p_grant_id  => p_grant_id,
    p_title     => (select title from app_public.grant_definition where id = p_grant_id),
    p_description => (select description from app_public.grant_definition where id = p_grant_id),
    p_awarded_token_amount => (select awarded_token_amount from app_public.grant_definition where id = p_grant_id),
    p_max_successful_claim_count => (select max_successful_claim_count from app_public.grant_definition where id = p_grant_id),
    p_expires_at => (select expires_at from app_public.grant_definition where id = p_grant_id),
    p_linked_campaign_id => (select linked_campaign_id from app_public.grant_definition where id = p_grant_id),
    p_archived_at => now()
  );
end;
$$;

grant execute on function app_public.archive_grant(uuid)
  to admin;

comment on function app_public.archive_grant(uuid)
  is '@name archiveGrant
Archives a grant definition so it no longer appears in the claim flow. Admin only.';

commit;
