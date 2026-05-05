-- Migration 092: auto-decline open claims when a need is deactivated

-- ─── Helper: decline all open claims on a given need ─────────────────────────
-- Used by both the deactivation trigger and any future need-lifecycle hooks.

create or replace function app_private.decline_open_claims_on_need(
  p_need_id        uuid,
  p_reason         text  -- 'need_deactivated' | 'need_expired'
)
returns integer    -- number of claims declined
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_declined_count integer;
begin
  -- Decline all currently open claims on this need
  with declined as (
    update app_public.need_claim
    set status     = case p_reason
                       when 'need_expired'     then 'expired'
                       else                         'declined'
                     end,
        updated_at = now()
    where need_id  = p_need_id
      and status   = 'open'
    returning id, claimer_account_id
  ),
  notifications as (
    insert into app_public.need_claim_notification (
      recipient_account_id,
      need_claim_id,
      event_type,
      payload
    )
    select
      d.claimer_account_id,
      d.id,
      case p_reason
        when 'need_expired'     then 'claim_expired'
        else                         'claim_need_deactivated'
      end,
      jsonb_build_object('needId', p_need_id, 'reason', p_reason)
    from declined d
    returning id
  )
  select count(*)::integer into v_declined_count from declined;

  -- For need_expired: also notify the need creator once with a summary
  if p_reason = 'need_expired' and v_declined_count > 0 then
    insert into app_public.need_claim_notification (
      recipient_account_id,
      need_claim_id,
      event_type,
      payload
    )
    select
      n.creator_account_id,
      nc.id,       -- use first claim id as representative
      'need_expired_claims_declined',
      jsonb_build_object('needId', p_need_id, 'declinedCount', v_declined_count)
    from app_public.need n
    join app_public.need_claim nc on nc.need_id = n.id
    where n.id = p_need_id
    limit 1;
  end if;

  return v_declined_count;
end;
$$;

-- ─── Trigger function: fires after need.is_active is set to false ─────────────

create or replace function app_private.on_need_deactivated()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  -- Only act when transitioning from active → inactive (not on INSERT or
  -- when the row was already inactive)
  if (TG_OP = 'UPDATE') and (OLD.is_active = true) and (NEW.is_active = false) then
    -- Only decline when the expiry did NOT drive this deactivation (the
    -- expire_overdue_needs_and_claims function already handles expired needs).
    -- If expires_at is in the past we treat it as an expiry-driven deactivation;
    -- otherwise it is an explicit creator deactivation.
    if NEW.expires_at is not null and NEW.expires_at <= now() then
      -- Let expire_overdue_needs_and_claims handle its own case; skip here.
      null;
    else
      perform app_private.decline_open_claims_on_need(NEW.id, 'need_deactivated');
    end if;
  end if;

  return NEW;
end;
$$;

-- Create the trigger (idempotent: drop first)
drop trigger if exists need_deactivated_claims_trigger on app_public.need;

create trigger need_deactivated_claims_trigger
  after update of is_active on app_public.need
  for each row
  execute function app_private.on_need_deactivated();

-- ─── Patch expire_overdue_needs_and_claims to use the shared helper ──────────
-- This replaces the inline expiry logic with the helper so notifications are
-- consistent and the creator also receives a batch summary.

create or replace function app_private.expire_overdue_needs_and_claims()
returns table (
  expired_need_count integer,
  expired_claim_count integer
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_need                record;
  v_total_claim_count   integer := 0;
  v_declined_count      integer;
  v_expired_need_count  integer := 0;
begin
  for v_need in
    update app_public.need
    set is_active  = false,
        updated_at = now()
    where is_active
      and expires_at is not null
      and expires_at <= now()
    returning id, creator_account_id
  loop
    v_expired_need_count := v_expired_need_count + 1;
    v_declined_count := app_private.decline_open_claims_on_need(v_need.id, 'need_expired');
    v_total_claim_count  := v_total_claim_count + v_declined_count;
  end loop;

  return query select v_expired_need_count, v_total_claim_count;
end;
$$;

-- The trigger fires AFTER the UPDATE that expire_overdue_needs_and_claims just
-- issued, but expires_at <= now() at that point so the trigger will take the
-- "let expire_overdue handle it" branch and do nothing — no double-processing.
