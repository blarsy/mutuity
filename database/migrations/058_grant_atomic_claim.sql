begin;

-- Composite return type for the atomic grant claim function.
-- outcome_code: one of 'success', 'not_authenticated', 'grant_unavailable', 'expired',
--   'already_claimed', 'cap_reached', 'not_targeted', 'campaign_criterion_not_satisfied'
-- claimed_amount: token amount awarded (null when outcome is not 'success')
-- grant_claim_id: id of the resulting grant_claim row (null when outcome is not 'success')
drop type if exists app_public.grant_claim_result cascade;

create type app_public.grant_claim_result as (
  outcome_code        text,
  claimed_amount      integer,
  grant_claim_id      uuid
);

-- Atomic grant claim function.
-- Evaluates all criteria in a single serialized transaction block:
--   - authentication, grant availability, expiry, already-claimed, cap, targeting, campaign criterion
-- On success creates a token_movement and a grant_claim record.
-- Returns a safe grant_claim_result row for API/UI use; never raises user-visible exceptions
-- beyond authentication errors.
create or replace function app_public.claim_grant(
  p_grant_id uuid
)
returns app_public.grant_claim_result
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id        uuid;
  v_grant             app_public.grant_definition;
  v_claim_count       integer;
  v_has_targeting     boolean;
  v_is_targeted       boolean;
  v_movement          app_public.token_movement;
  v_claim             app_public.grant_claim;
begin
  -- 1. Authentication check.
  v_account_id := app_private.current_account_id();
  if v_account_id is null then
    return row('not_authenticated', null, null)::app_public.grant_claim_result;
  end if;

  -- 2. Load and lock grant (FOR UPDATE serializes concurrent claim attempts for cap check).
  select *
  into v_grant
  from app_public.grant_definition gd
  where gd.id = p_grant_id
  for update;

  if not found or v_grant.archived_at is not null then
    return row('grant_unavailable', null, null)::app_public.grant_claim_result;
  end if;

  -- 3. Expiry check.
  if v_grant.expires_at is not null and v_grant.expires_at < now() then
    return row('expired', null, null)::app_public.grant_claim_result;
  end if;

  -- 4. Already-claimed check (unique constraint prevents duplicates, but early exit improves UX).
  if exists (
    select 1
    from app_public.grant_claim gc
    where gc.grant_id = p_grant_id
      and gc.account_id = v_account_id
  ) then
    return row('already_claimed', null, null)::app_public.grant_claim_result;
  end if;

  -- 5. Cap check (max_successful_claim_count null means unlimited).
  if v_grant.max_successful_claim_count is not null then
    select count(*)
    into v_claim_count
    from app_public.grant_claim gc
    where gc.grant_id = p_grant_id;

    if v_claim_count >= v_grant.max_successful_claim_count then
      return row('cap_reached', null, null)::app_public.grant_claim_result;
    end if;
  end if;

  -- 6. Targeting check.
  -- If the grant has any targeting rows (account-id or email) the account must match at least one.
  select (
    exists (select 1 from app_public.grant_target_account gta where gta.grant_id = p_grant_id)
    or
    exists (select 1 from app_public.grant_target_email gte where gte.grant_id = p_grant_id)
  )
  into v_has_targeting;

  if v_has_targeting then
    -- Check account-id match.
    select exists (
      select 1
      from app_public.grant_target_account gta
      where gta.grant_id = p_grant_id
        and gta.account_id = v_account_id
    )
    into v_is_targeted;

    -- If not matched by account-id, check normalized email match.
    if not v_is_targeted then
      select exists (
        select 1
        from app_public.grant_target_email gte
        join app_private.account_identity ai
          on ai.provider_email_normalized = gte.target_email_normalized
        where gte.grant_id = p_grant_id
          and ai.account_id = v_account_id
      )
      into v_is_targeted;
    end if;

    if not v_is_targeted then
      return row('not_targeted', null, null)::app_public.grant_claim_result;
    end if;
  end if;

  -- 7. Campaign criterion check.
  if not app_private.is_grant_campaign_criterion_satisfied(p_grant_id, v_account_id) then
    return row('campaign_criterion_not_satisfied', null, null)::app_public.grant_claim_result;
  end if;

  -- 8. All criteria satisfied: create token movement.
  v_movement := app_private.create_token_movement(
    p_account_id     => v_account_id,
    p_amount_delta   => v_grant.awarded_token_amount,
    p_event_type     => 'grant_claim',
    p_reference_type => 'grant_definition',
    p_reference_id   => p_grant_id,
    p_idempotency_key => 'grant_claim:' || p_grant_id::text || ':' || v_account_id::text
  );

  -- 9. Record grant claim with token movement linkage.
  v_claim := app_private.record_grant_claim_award(
    p_grant_id            => p_grant_id,
    p_account_id          => v_account_id,
    p_awarded_token_amount => v_grant.awarded_token_amount,
    p_token_movement_id   => v_movement.id
  );

  return row('success', v_grant.awarded_token_amount, v_claim.id)::app_public.grant_claim_result;
end;
$$;

grant execute on function app_public.claim_grant(uuid)
  to identified_account, manager, admin;

comment on function app_public.claim_grant(uuid)
  is '@name claimGrant
Atomically evaluates all grant criteria for the authenticated account and, if satisfied,
issues a token award and returns outcome_code = ''success''. On failure returns a safe denial
reason code: not_authenticated | grant_unavailable | expired | already_claimed | cap_reached |
not_targeted | campaign_criterion_not_satisfied.';

comment on type app_public.grant_claim_result
  is 'Result of an atomic grant claim attempt: outcome_code plus awarded amount and claim id on success.';

commit;
