begin;

create table if not exists app_private.delivery_digest_item (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app_public.account(id) on delete cascade,
  event_category text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  broadcasted_at timestamptz,
  broadcast_mail_id uuid references app_private.mail_outbox(id) on delete set null,
  constraint delivery_digest_item_event_category_check check (
    event_category in (
      'new_resource_added',
      'new_need_added',
      'unread_notifications',
      'new_chat_message_received'
    )
  )
);

create index if not exists delivery_digest_item_pending_account_idx
  on app_private.delivery_digest_item (account_id, event_category, created_at asc)
  where broadcasted_at is null;

create index if not exists delivery_digest_item_broadcast_mail_idx
  on app_private.delivery_digest_item (broadcast_mail_id)
  where broadcast_mail_id is not null;

comment on table app_private.delivery_digest_item is
  'Pending preference-managed digest items retained until they are broadcasted in a summary email.';

comment on column app_private.delivery_digest_item.payload is
  'Structured per-event payload used to render digest sections for preference-managed notifications.';

create table if not exists app_private.push_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app_public.account(id) on delete cascade,
  event_category text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'skipped', 'failed')),
  provider_message_id text,
  failure_reason text,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_notification_outbox_event_category_check check (
    event_category in (
      'new_resource_added',
      'new_need_added',
      'unread_notifications',
      'new_chat_message_received'
    )
  ),
  constraint push_notification_outbox_title_present check (btrim(title) <> ''),
  constraint push_notification_outbox_body_present check (btrim(body) <> '')
);

create index if not exists push_notification_outbox_status_created_idx
  on app_private.push_notification_outbox (status, created_at asc);

create index if not exists push_notification_outbox_account_created_idx
  on app_private.push_notification_outbox (account_id, created_at desc);

comment on table app_private.push_notification_outbox is
  'Unified outbox for realtime push notifications before delivery to the external push provider.';

create or replace function app_private.queue_delivery_digest_item(
  p_account_id uuid,
  p_event_category text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_item_id uuid;
begin
  if p_event_category not in (
    'new_resource_added',
    'new_need_added',
    'unread_notifications',
    'new_chat_message_received'
  ) then
    raise exception using message = 'Unsupported event category';
  end if;

  insert into app_private.delivery_digest_item (
    account_id,
    event_category,
    payload
  )
  values (
    p_account_id,
    p_event_category,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

create or replace function app_private.queue_push_notification_outbox(
  p_account_id uuid,
  p_event_category text,
  p_title text,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification_id uuid;
begin
  if p_event_category not in (
    'new_resource_added',
    'new_need_added',
    'unread_notifications',
    'new_chat_message_received'
  ) then
    raise exception using message = 'Unsupported event category';
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    return null;
  end if;

  if nullif(btrim(coalesce(p_body, '')), '') is null then
    return null;
  end if;

  insert into app_private.push_notification_outbox (
    account_id,
    event_category,
    title,
    body,
    metadata
  )
  values (
    p_account_id,
    p_event_category,
    btrim(p_title),
    btrim(p_body),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

create or replace function app_private.dispatch_preference_managed_event(
  p_account_id uuid,
  p_event_category text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb
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

  if v_strategy = 'email_summary' then
    return app_private.queue_delivery_digest_item(
      p_account_id,
      p_event_category,
      jsonb_build_object(
        'title', btrim(coalesce(p_title, '')),
        'body', btrim(coalesce(p_body, '')),
        'data', coalesce(p_payload, '{}'::jsonb)
      )
    );
  end if;

  return app_private.queue_push_notification_outbox(
    p_account_id,
    p_event_category,
    p_title,
    p_body,
    p_payload
  );
end;
$$;

create or replace function app_private.claim_pending_push_notification_outbox(
  p_notification_id uuid default null,
  p_batch_size integer default 25
)
returns table (
  id uuid,
  account_id uuid,
  event_category text,
  title text,
  body text,
  metadata jsonb
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  return query
  with candidate as (
    select po.id
    from app_private.push_notification_outbox po
    where po.status = 'pending'
      and (p_notification_id is null or po.id = p_notification_id)
    order by po.created_at asc
    limit greatest(1, coalesce(p_batch_size, 25))
    for update skip locked
  ),
  updated as (
    update app_private.push_notification_outbox po
    set status = 'processing',
        updated_at = now()
    from candidate c
    where po.id = c.id
    returning po.id, po.account_id, po.event_category, po.title, po.body, po.metadata, po.created_at
  )
  select u.id, u.account_id, u.event_category, u.title, u.body, u.metadata
  from updated u
  order by u.created_at asc;
end;
$$;

create or replace function app_private.mark_push_notification_outbox_sent(
  p_notification_id uuid,
  p_provider_message_id text default null
)
returns void
language sql
security definer
set search_path = app_public, app_private, public
as $$
  update app_private.push_notification_outbox
  set status = 'sent',
      provider_message_id = p_provider_message_id,
      failure_reason = null,
      attempts = attempts + 1,
      last_attempt_at = now(),
      sent_at = now(),
      updated_at = now()
  where id = p_notification_id;
$$;

create or replace function app_private.mark_push_notification_outbox_skipped(
  p_notification_id uuid,
  p_reason text default null
)
returns void
language sql
security definer
set search_path = app_public, app_private, public
as $$
  update app_private.push_notification_outbox
  set status = 'skipped',
      provider_message_id = null,
      failure_reason = p_reason,
      attempts = attempts + 1,
      last_attempt_at = now(),
      sent_at = now(),
      updated_at = now()
  where id = p_notification_id;
$$;

create or replace function app_private.mark_push_notification_outbox_failed(
  p_notification_id uuid,
  p_failure_reason text
)
returns void
language sql
security definer
set search_path = app_public, app_private, public
as $$
  update app_private.push_notification_outbox
  set status = 'failed',
      failure_reason = p_failure_reason,
      attempts = attempts + 1,
      last_attempt_at = now(),
      updated_at = now()
  where id = p_notification_id;
$$;

create or replace function app_private.get_pending_delivery_digest_accounts(
  p_run_at timestamptz default now(),
  p_batch_size integer default 100
)
returns table (
  account_id uuid,
  recipient_email text,
  locale text,
  item_ids uuid[],
  items jsonb
)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  with pending as (
    select
      ddi.id,
      ddi.account_id,
      ddi.event_category,
      ddi.payload,
      ddi.created_at,
      pref.summary_frequency_days,
      min(ddi.created_at) over (partition by ddi.account_id, ddi.event_category) as earliest_created_at
    from app_private.delivery_digest_item ddi
    join app_private.get_account_delivery_preferences_for_account(ddi.account_id) pref
      on pref.event_category = ddi.event_category
    where ddi.broadcasted_at is null
      and pref.delivery_strategy = 'email_summary'
  ),
  eligible as (
    select p.*
    from pending p
    where p.earliest_created_at <= (
      p_run_at - make_interval(days => greatest(coalesce(p.summary_frequency_days, 1), 1))
    )
  ),
  selected_accounts as (
    select distinct e.account_id
    from eligible e
    order by e.account_id asc
    limit least(greatest(coalesce(p_batch_size, 100), 1), 500)
  ),
  grouped as (
    select
      e.account_id,
      array_agg(e.id order by e.created_at asc) as item_ids,
      jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'event_category', e.event_category,
          'payload', e.payload,
          'created_at', e.created_at
        )
        order by e.created_at asc
      ) as items
    from eligible e
    join selected_accounts sa on sa.account_id = e.account_id
    group by e.account_id
  )
  select
    g.account_id,
    lower(c.login_identifier) as recipient_email,
    coalesce(a.preferred_language, 'en') as locale,
    g.item_ids,
    g.items
  from grouped g
  join app_public.account a on a.id = g.account_id
  join lateral (
    select ac.login_identifier
    from app_private.account_credential ac
    where ac.account_id = g.account_id
      and ac.is_active = true
    order by ac.created_at asc
    limit 1
  ) c on true
  order by g.account_id asc;
$$;

create or replace function app_private.mark_delivery_digest_items_broadcasted(
  p_item_ids uuid[],
  p_mail_id uuid default null
)
returns integer
language sql
security definer
set search_path = app_public, app_private, public
as $$
  with updated as (
    update app_private.delivery_digest_item ddi
    set broadcasted_at = now(),
        broadcast_mail_id = p_mail_id
    where ddi.id = any (coalesce(p_item_ids, '{}'::uuid[]))
      and ddi.broadcasted_at is null
    returning 1
  )
  select count(*)::integer
  from updated;
$$;

create or replace function app_private.enqueue_new_resource_delivery(
  p_resource_id uuid,
  p_min_score numeric default 35,
  p_limit_count integer default 100
)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_resource record;
  v_target record;
  v_delivery_id uuid;
  v_count integer := 0;
begin
  select
    r.id,
    r.title,
    r.location,
    r.creator_account_id
  into v_resource
  from app_public.resource r
  where r.id = p_resource_id
    and r.is_active
    and coalesce(r.expires_at > now(), true);

  if v_resource.id is null then
    return 0;
  end if;

  for v_target in
    select n.account_id, n.weighted_score
    from app_private.get_accounts_to_notify_of_new_resource(
      p_resource_id,
      p_min_score,
      p_limit_count
    ) n
  loop
    v_delivery_id := app_private.dispatch_preference_managed_event(
      v_target.account_id,
      'new_resource_added',
      'New resource added near you',
      coalesce(v_resource.title, 'A new resource has been added'),
      jsonb_build_object(
        'resource_id', v_resource.id,
        'resource_title', v_resource.title,
        'resource_location', v_resource.location,
        'weighted_score', v_target.weighted_score
      )
    );

    if v_delivery_id is not null then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

create or replace function app_private.trigger_enqueue_new_resource_delivery()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  if new.is_active and coalesce(new.expires_at > now(), true) then
    perform app_private.enqueue_new_resource_delivery(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_resource_enqueue_new_resource_delivery on app_public.resource;

create trigger trg_resource_enqueue_new_resource_delivery
after insert on app_public.resource
for each row
execute function app_private.trigger_enqueue_new_resource_delivery();

grant execute on function app_private.queue_delivery_digest_item(uuid, text, jsonb)
  to identified_account, manager, admin;
grant execute on function app_private.queue_push_notification_outbox(uuid, text, text, text, jsonb)
  to identified_account, manager, admin;
grant execute on function app_private.dispatch_preference_managed_event(uuid, text, text, text, jsonb)
  to identified_account, manager, admin;
grant execute on function app_private.claim_pending_push_notification_outbox(uuid, integer)
  to identified_account, manager, admin;
grant execute on function app_private.mark_push_notification_outbox_sent(uuid, text)
  to identified_account, manager, admin;
grant execute on function app_private.mark_push_notification_outbox_skipped(uuid, text)
  to identified_account, manager, admin;
grant execute on function app_private.mark_push_notification_outbox_failed(uuid, text)
  to identified_account, manager, admin;
grant execute on function app_private.get_pending_delivery_digest_accounts(timestamptz, integer)
  to identified_account, manager, admin;
grant execute on function app_private.mark_delivery_digest_items_broadcasted(uuid[], uuid)
  to identified_account, manager, admin;
grant execute on function app_private.enqueue_new_resource_delivery(uuid, numeric, integer)
  to identified_account, manager, admin;

comment on function app_private.queue_delivery_digest_item(uuid, text, jsonb) is
  'Queues one preference-managed event for later inclusion in a notification digest email.';
comment on function app_private.queue_push_notification_outbox(uuid, text, text, text, jsonb) is
  'Queues one preference-managed realtime push notification in the push outbox.';
comment on function app_private.dispatch_preference_managed_event(uuid, text, text, text, jsonb) is
  'Routes one preference-managed event to either the realtime push outbox or the digest queue based on saved account preferences and activity gating.';
comment on function app_private.claim_pending_push_notification_outbox(uuid, integer) is
  'Atomically claims pending push notifications by switching them to processing and returns rows to deliver.';
comment on function app_private.mark_push_notification_outbox_sent(uuid, text) is
  'Marks one push notification outbox row as sent and stores provider metadata.';
comment on function app_private.mark_push_notification_outbox_skipped(uuid, text) is
  'Marks one push notification outbox row as skipped while preserving auditability.';
comment on function app_private.mark_push_notification_outbox_failed(uuid, text) is
  'Marks one push notification outbox row as failed and stores the failure reason.';
comment on function app_private.get_pending_delivery_digest_accounts(timestamptz, integer) is
  'Returns accounts with digest items due for broadcast at the supplied run timestamp, including grouped pending item payloads.';
comment on function app_private.mark_delivery_digest_items_broadcasted(uuid[], uuid) is
  'Marks selected digest items as broadcasted and optionally associates them with the queued mail outbox row.';
comment on function app_private.enqueue_new_resource_delivery(uuid, numeric, integer) is
  'Selects target accounts for a newly inserted resource and routes each eligible out-of-app event according to saved preferences.';

revoke all on function app_private.queue_delivery_digest_item(uuid, text, jsonb) from public;
revoke all on function app_private.queue_push_notification_outbox(uuid, text, text, text, jsonb) from public;
revoke all on function app_private.dispatch_preference_managed_event(uuid, text, text, text, jsonb) from public;
revoke all on function app_private.claim_pending_push_notification_outbox(uuid, integer) from public;
revoke all on function app_private.mark_push_notification_outbox_sent(uuid, text) from public;
revoke all on function app_private.mark_push_notification_outbox_skipped(uuid, text) from public;
revoke all on function app_private.mark_push_notification_outbox_failed(uuid, text) from public;
revoke all on function app_private.get_pending_delivery_digest_accounts(timestamptz, integer) from public;
revoke all on function app_private.mark_delivery_digest_items_broadcasted(uuid[], uuid) from public;
revoke all on function app_private.enqueue_new_resource_delivery(uuid, numeric, integer) from public;

commit;