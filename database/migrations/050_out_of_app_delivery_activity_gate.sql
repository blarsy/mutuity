begin;

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

comment on function app_private.account_has_active_session(uuid) is
  'Returns true when an account currently has at least one active non-revoked session.';

create or replace function app_private.can_emit_out_of_app_delivery(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select not app_private.account_has_active_session(p_account_id);
$$;

comment on function app_private.can_emit_out_of_app_delivery(uuid) is
  'Activity gate for out-of-app delivery: true only when account has no active session.';

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

comment on function app_private.should_emit_realtime_push(uuid, text) is
  'Returns true when realtime push is configured for category and activity gate allows out-of-app sends.';

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

comment on function app_private.queue_preference_managed_mail_outbox(uuid, text, text, jsonb) is
  'Queues digest mail only when account has no active session and category strategy is email_summary.';

grant execute on function app_private.account_has_active_session(uuid)
  to identified_account, manager, admin;

grant execute on function app_private.can_emit_out_of_app_delivery(uuid)
  to identified_account, manager, admin;

grant execute on function app_private.should_emit_realtime_push(uuid, text)
  to identified_account, manager, admin;

grant execute on function app_private.queue_preference_managed_mail_outbox(uuid, text, text, jsonb)
  to identified_account, manager, admin;

revoke all on function app_private.account_has_active_session(uuid) from public;
revoke all on function app_private.can_emit_out_of_app_delivery(uuid) from public;
revoke all on function app_private.should_emit_realtime_push(uuid, text) from public;
revoke all on function app_private.queue_preference_managed_mail_outbox(uuid, text, text, jsonb) from public;

commit;
