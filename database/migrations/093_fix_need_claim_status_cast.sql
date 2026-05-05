-- Migration 093: fix need_claim_status cast in decline_open_claims_on_need
-- The CASE expression in migration 092 returned `text` but the need_claim.status
-- column is of type need_claim_status (an enum); PostgreSQL requires an explicit cast.

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
  -- Decline all currently open claims on this need.
  -- Cast the target status explicitly to the enum type to avoid
  -- "column status is of type need_claim_status but expression is of type text".
  with declined as (
    update app_public.need_claim
    set status     = case p_reason
                       when 'need_expired' then 'expired'::app_public.need_claim_status
                       else                     'declined'::app_public.need_claim_status
                     end,
        updated_at = now()
    where need_id  = p_need_id
      and status   = 'open'::app_public.need_claim_status
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
