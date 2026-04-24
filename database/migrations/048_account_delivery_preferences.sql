begin;

create table if not exists app_public.account_delivery_preference (
  account_id uuid not null references app_public.account(id) on delete cascade,
  event_category text not null,
  delivery_strategy text not null default 'realtime_push',
  summary_frequency_days integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_delivery_preference_pkey primary key (account_id, event_category),
  constraint account_delivery_preference_event_category_check check (
    event_category in (
      'new_resource_added',
      'new_need_added',
      'unread_notifications',
      'new_chat_message_received'
    )
  ),
  constraint account_delivery_preference_delivery_strategy_check check (
    delivery_strategy in ('realtime_push', 'email_summary')
  ),
  constraint account_delivery_preference_summary_frequency_days_check check (
    summary_frequency_days in (1, 3, 7, 30)
  )
);

comment on table app_public.account_delivery_preference is
  'Per-account delivery preferences for out-of-app notifications by managed event category.';

comment on column app_public.account_delivery_preference.event_category is
  'Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received.';

comment on column app_public.account_delivery_preference.delivery_strategy is
  'Out-of-app delivery strategy per category: realtime_push or email_summary.';

comment on column app_public.account_delivery_preference.summary_frequency_days is
  'Digest cadence in days for email_summary strategy. Allowed values: 1, 3, 7, 30.';

create index if not exists account_delivery_preference_account_idx
  on app_public.account_delivery_preference (account_id);

alter table app_public.account_delivery_preference enable row level security;

drop policy if exists account_delivery_preference_select_policy on app_public.account_delivery_preference;
create policy account_delivery_preference_select_policy on app_public.account_delivery_preference
  for select
  using (
    app_private.is_manager()
    or account_id = app_private.current_account_id()
  );

drop policy if exists account_delivery_preference_insert_policy on app_public.account_delivery_preference;
create policy account_delivery_preference_insert_policy on app_public.account_delivery_preference
  for insert
  with check (
    app_private.is_manager()
    or account_id = app_private.current_account_id()
  );

drop policy if exists account_delivery_preference_update_policy on app_public.account_delivery_preference;
create policy account_delivery_preference_update_policy on app_public.account_delivery_preference
  for update
  using (
    app_private.is_manager()
    or account_id = app_private.current_account_id()
  )
  with check (
    app_private.is_manager()
    or account_id = app_private.current_account_id()
  );

grant select, insert, update on app_public.account_delivery_preference to identified_account, manager, admin;

create or replace function app_public.set_account_delivery_preference(
  p_event_category text,
  p_delivery_strategy text,
  p_summary_frequency_days integer default null
)
returns app_public.account_delivery_preference
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_frequency integer;
  v_preference app_public.account_delivery_preference;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if p_event_category not in (
    'new_resource_added',
    'new_need_added',
    'unread_notifications',
    'new_chat_message_received'
  ) then
    raise exception using message = 'Unsupported event category';
  end if;

  if p_delivery_strategy not in ('realtime_push', 'email_summary') then
    raise exception using message = 'Unsupported delivery strategy';
  end if;

  v_frequency := coalesce(p_summary_frequency_days, 1);

  if v_frequency not in (1, 3, 7, 30) then
    raise exception using message = 'Unsupported summary frequency';
  end if;

  insert into app_public.account_delivery_preference (
    account_id,
    event_category,
    delivery_strategy,
    summary_frequency_days,
    updated_at
  )
  values (
    v_account_id,
    p_event_category,
    p_delivery_strategy,
    v_frequency,
    now()
  )
  on conflict (account_id, event_category)
  do update
  set
    delivery_strategy = excluded.delivery_strategy,
    summary_frequency_days = excluded.summary_frequency_days,
    updated_at = now()
  returning * into v_preference;

  return v_preference;
end;
$$;

comment on function app_public.set_account_delivery_preference(text, text, integer) is
  '@name setAccountDeliveryPreference';

create or replace function app_public.get_account_delivery_preferences()
returns table (
  event_category text,
  delivery_strategy text,
  summary_frequency_days integer
)
language sql
security definer
set search_path = app_public, app_private, public
as $$
  with categories(event_category, sort_order) as (
    values
      ('new_resource_added'::text, 1),
      ('new_need_added'::text, 2),
      ('unread_notifications'::text, 3),
      ('new_chat_message_received'::text, 4)
  )
  select
    c.event_category,
    coalesce(p.delivery_strategy, 'realtime_push') as delivery_strategy,
    coalesce(p.summary_frequency_days, 1) as summary_frequency_days
  from categories c
  left join app_public.account_delivery_preference p
    on p.account_id = app_private.current_account_id()
   and p.event_category = c.event_category
  order by c.sort_order;
$$;

comment on function app_public.get_account_delivery_preferences() is
  '@name getAccountDeliveryPreferences';

create or replace function app_private.get_account_delivery_preferences_for_account(
  p_account_id uuid
)
returns table (
  event_category text,
  delivery_strategy text,
  summary_frequency_days integer
)
language sql
stable
set search_path = app_public, app_private, public
as $$
  with categories(event_category, sort_order) as (
    values
      ('new_resource_added'::text, 1),
      ('new_need_added'::text, 2),
      ('unread_notifications'::text, 3),
      ('new_chat_message_received'::text, 4)
  )
  select
    c.event_category,
    coalesce(p.delivery_strategy, 'realtime_push') as delivery_strategy,
    coalesce(p.summary_frequency_days, 1) as summary_frequency_days
  from categories c
  left join app_public.account_delivery_preference p
    on p.account_id = p_account_id
   and p.event_category = c.event_category
  order by c.sort_order;
$$;

grant execute on function app_public.set_account_delivery_preference(text, text, integer)
  to identified_account, manager, admin;

grant execute on function app_public.get_account_delivery_preferences()
  to identified_account, manager, admin;

grant execute on function app_private.get_account_delivery_preferences_for_account(uuid)
  to identified_account, manager, admin;

revoke all on function app_private.get_account_delivery_preferences_for_account(uuid) from public;

commit;
