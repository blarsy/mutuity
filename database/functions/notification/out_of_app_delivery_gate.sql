create or replace function app_private.account_has_active_session(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select exists (
    select 1
    from app_private.account_session s
    where s.account_id = p_account_id
      and s.revoked_at is null
      and s.expires_at > now()
  );
$$;

create or replace function app_private.can_emit_out_of_app_delivery(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select not app_private.account_has_active_session(p_account_id);
$$;

create or replace function app_private.should_emit_realtime_push(
  p_account_id uuid,
  p_event_category text
)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  with pref as (
    select p.delivery_strategy
    from app_private.get_account_delivery_preferences_for_account(p_account_id) p
    where p.event_category = p_event_category
    limit 1
  )
  select
    app_private.can_emit_out_of_app_delivery(p_account_id)
    and coalesce((select delivery_strategy = 'realtime_push' from pref), true);
$$;

create or replace function app_private.queue_preference_managed_mail_outbox(
  p_account_id uuid,
  p_event_category text,
  p_mail_kind text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_strategy text;
begin
  if p_event_category not in (
    'new_resource_added',
    'new_need_added',
    'unread_notifications',
    'new_chat_message_received'
  ) then
    raise exception using message = 'Unsupported event category';
  end if;

  if not app_private.can_emit_out_of_app_delivery(p_account_id) then
    return null;
  end if;

  select p.delivery_strategy
  into v_strategy
  from app_private.get_account_delivery_preferences_for_account(p_account_id) p
  where p.event_category = p_event_category
  limit 1;

  v_strategy := coalesce(v_strategy, 'realtime_push');

  if v_strategy <> 'email_summary' then
    return null;
  end if;

  return app_private.queue_mail_outbox(
    p_account_id,
    p_mail_kind,
    null,
    coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object('eventCategory', p_event_category)
  );
end;
$$;
