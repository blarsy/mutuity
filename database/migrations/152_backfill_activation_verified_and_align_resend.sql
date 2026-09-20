begin;

-- Backfill activation_verified_at for accounts whose credential or social
-- identity is verified but whose activation timestamp was never set.
-- This fixes the mismatch where the session reports emailVerified=false
-- (activation_verified_at is null) while request_email_verification treats
-- the account as already verified (credential email_verified_at is set) and
-- silently skips queuing the mail.
update app_public.account a
set activation_verified_at = coalesce(
  a.activation_verified_at,
  (
    select min(c.email_verified_at)
    from app_private.account_credential c
    where c.account_id = a.id
      and c.is_active = true
      and c.email_verified_at is not null
  ),
  (
    select min(coalesce(ai.updated_at, ai.linked_at, ai.created_at))
    from app_private.account_identity ai
    where ai.account_id = a.id
      and ai.provider in ('google', 'apple')
      and ai.provider_email_verified = true
  )
)
where a.activation_verified_at is null
  and (
    exists (
      select 1
      from app_private.account_credential c
      where c.account_id = a.id
        and c.is_active = true
        and c.email_verified_at is not null
    )
    or exists (
      select 1
      from app_private.account_identity ai
      where ai.account_id = a.id
        and ai.provider in ('google', 'apple')
        and ai.provider_email_verified = true
    )
  );

-- Align request_email_verification with is_account_email_verified so the
-- "already verified" early return can never disagree with the flag the
-- session exposes to the UI. Previously it only checked the credential's
-- email_verified_at, silently returning true without queuing mail for
-- accounts whose activation_verified_at was still null.
create or replace function app_public.request_email_verification(
  identifier text,
  verification_ttl_ms bigint default 86400000,
  throttle_ms bigint default 60000
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_account_id uuid;
  v_is_verified boolean;
  v_token text;
begin
  v_identifier := lower(btrim(identifier));

  select c.account_id, c.email_verified_at is not null
  into v_account_id, v_is_verified
  from app_private.account_credential c
  where lower(c.login_identifier) = v_identifier
    and c.is_active = true
  limit 1;

  if v_account_id is null then
    select a.id, a.activation_verified_at is not null
    into v_account_id, v_is_verified
    from app_public.account a
    where lower(a.external_subject) = v_identifier
    limit 1;
  end if;

  if v_account_id is null then
    return true;
  end if;

  -- Single source of truth: same predicate the session/emailVerified flag
  -- uses, so the resend banner and this mutation can never disagree.
  if app_private.is_account_email_verified(v_account_id) then
    return true;
  end if;

  v_token := app_private.issue_account_auth_token(
    v_account_id,
    'email_verification',
    verification_ttl_ms,
    throttle_ms
  );

  if v_token is not null then
    perform app_private.queue_mail_outbox(
      v_account_id,
      'auth_email_verification',
      v_token,
      jsonb_build_object('source', 'request_email_verification')
    );
  end if;

  return true;
end;
$$;

commit;
