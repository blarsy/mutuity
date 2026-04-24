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
