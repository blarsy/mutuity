begin;

do $$
begin
  create type app_public.chat_context_kind as enum ('need', 'resource');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists app_public.resource_conversation (
  id uuid primary key default gen_random_uuid(),
  resource_bid_id uuid not null unique references app_public.resource_bid(id) on delete cascade,
  resource_id uuid not null references app_public.resource(id) on delete cascade,
  owner_account_id uuid not null references app_public.account(id) on delete cascade,
  bidder_account_id uuid not null references app_public.account(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_conversation_distinct_participants check (owner_account_id <> bidder_account_id)
);

create table if not exists app_public.resource_message (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references app_public.resource_conversation(id) on delete cascade,
  sender_account_id uuid not null references app_public.account(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint resource_message_body_present check (btrim(body) <> '')
);

create table if not exists app_public.resource_message_image (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references app_public.resource_message(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint resource_message_image_url_present check (btrim(image_url) <> '')
);

create table if not exists app_public.chat_typing_presence (
  conversation_kind app_public.chat_context_kind not null,
  conversation_id uuid not null,
  account_id uuid not null references app_public.account(id) on delete cascade,
  last_typed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_kind, conversation_id, account_id)
);

create index if not exists resource_conversation_owner_account_idx
  on app_public.resource_conversation (owner_account_id, created_at desc);

create index if not exists resource_conversation_bidder_account_idx
  on app_public.resource_conversation (bidder_account_id, created_at desc);

create index if not exists resource_message_conversation_created_idx
  on app_public.resource_message (conversation_id, created_at asc);

create index if not exists resource_message_image_message_id_idx
  on app_public.resource_message_image (message_id, sort_order);

create index if not exists chat_typing_presence_lookup_idx
  on app_public.chat_typing_presence (conversation_kind, conversation_id, last_typed_at desc);

create index if not exists chat_typing_presence_account_idx
  on app_public.chat_typing_presence (account_id, updated_at desc);

drop trigger if exists trg_resource_conversation_set_updated_at on app_public.resource_conversation;
create trigger trg_resource_conversation_set_updated_at
  before update on app_public.resource_conversation
  for each row
  execute function app_private.set_updated_at();

drop trigger if exists trg_chat_typing_presence_set_updated_at on app_public.chat_typing_presence;
create trigger trg_chat_typing_presence_set_updated_at
  before update on app_public.chat_typing_presence
  for each row
  execute function app_private.set_updated_at();

create or replace function app_private.is_chat_participant(
  p_conversation_kind app_public.chat_context_kind,
  p_conversation_id uuid,
  p_account_id uuid
)
returns boolean
language sql
stable
as $$
  select case
    when p_conversation_kind = 'need' then exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = p_conversation_id
        and p_account_id in (cc.creator_account_id, cc.claimer_account_id)
    )
    when p_conversation_kind = 'resource' then exists (
      select 1
      from app_public.resource_conversation rc
      where rc.id = p_conversation_id
        and p_account_id in (rc.owner_account_id, rc.bidder_account_id)
    )
    else false
  end
$$;

create or replace view app_public.chat_conversation_summary as
with need_rows as (
  select
    'need'::app_public.chat_context_kind as conversation_kind,
    cc.id as conversation_id,
    cc.need_id as context_id,
    participant.participant_account_id,
    participant.other_account_id,
    n.title as context_title,
    coalesce(last_message.created_at, cc.created_at) as last_activity_at,
    coalesce(left(last_message.body, 280), '') as last_message_preview,
    (
      select count(*)::integer
      from app_public.claim_message unread
      where unread.conversation_id = cc.id
        and unread.sender_account_id <> participant.participant_account_id
        and unread.read_at is null
    ) as unread_count,
    cc.created_at
  from app_public.claim_conversation cc
  join app_public.need n on n.id = cc.need_id
  cross join lateral (
    values
      (cc.creator_account_id, cc.claimer_account_id),
      (cc.claimer_account_id, cc.creator_account_id)
  ) as participant(participant_account_id, other_account_id)
  left join lateral (
    select cm.created_at, cm.body
    from app_public.claim_message cm
    where cm.conversation_id = cc.id
    order by cm.created_at desc
    limit 1
  ) as last_message on true
),
resource_rows as (
  select
    'resource'::app_public.chat_context_kind as conversation_kind,
    rc.id as conversation_id,
    rc.resource_id as context_id,
    participant.participant_account_id,
    participant.other_account_id,
    r.title as context_title,
    coalesce(last_message.created_at, rc.created_at) as last_activity_at,
    coalesce(left(last_message.body, 280), '') as last_message_preview,
    (
      select count(*)::integer
      from app_public.resource_message unread
      where unread.conversation_id = rc.id
        and unread.sender_account_id <> participant.participant_account_id
        and unread.read_at is null
    ) as unread_count,
    rc.created_at
  from app_public.resource_conversation rc
  join app_public.resource r on r.id = rc.resource_id
  cross join lateral (
    values
      (rc.owner_account_id, rc.bidder_account_id),
      (rc.bidder_account_id, rc.owner_account_id)
  ) as participant(participant_account_id, other_account_id)
  left join lateral (
    select rm.created_at, rm.body
    from app_public.resource_message rm
    where rm.conversation_id = rc.id
    order by rm.created_at desc
    limit 1
  ) as last_message on true
)
select * from need_rows
union all
select * from resource_rows;

alter table app_public.resource_conversation enable row level security;
alter table app_public.resource_message enable row level security;
alter table app_public.resource_message_image enable row level security;
alter table app_public.chat_typing_presence enable row level security;

create policy resource_conversation_select_policy on app_public.resource_conversation
  for select
  using (
    app_private.is_admin()
    or owner_account_id = app_private.current_account_id()
    or bidder_account_id = app_private.current_account_id()
  );

create policy resource_conversation_insert_policy on app_public.resource_conversation
  for insert
  with check (
    app_private.is_admin()
    or owner_account_id = app_private.current_account_id()
    or bidder_account_id = app_private.current_account_id()
  );

create policy resource_message_select_policy on app_public.resource_message
  for select
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource_conversation rc
      where rc.id = conversation_id
        and app_private.current_account_id() in (rc.owner_account_id, rc.bidder_account_id)
    )
  );

create policy resource_message_insert_policy on app_public.resource_message
  for insert
  with check (
    app_private.is_admin()
    or sender_account_id = app_private.current_account_id()
  );

create policy resource_message_update_policy on app_public.resource_message
  for update
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource_conversation rc
      where rc.id = conversation_id
        and app_private.current_account_id() in (rc.owner_account_id, rc.bidder_account_id)
    )
  )
  with check (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource_conversation rc
      where rc.id = conversation_id
        and app_private.current_account_id() in (rc.owner_account_id, rc.bidder_account_id)
    )
  );

create policy resource_message_image_select_policy on app_public.resource_message_image
  for select
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource_message rm
      join app_public.resource_conversation rc on rc.id = rm.conversation_id
      where rm.id = message_id
        and app_private.current_account_id() in (rc.owner_account_id, rc.bidder_account_id)
    )
  );

create policy resource_message_image_insert_policy on app_public.resource_message_image
  for insert
  with check (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource_message rm
      join app_public.resource_conversation rc on rc.id = rm.conversation_id
      where rm.id = message_id
        and app_private.current_account_id() in (rc.owner_account_id, rc.bidder_account_id)
    )
  );

create policy chat_typing_presence_select_policy on app_public.chat_typing_presence
  for select
  using (
    app_private.is_admin()
    or app_private.is_chat_participant(conversation_kind, conversation_id, app_private.current_account_id())
  );

create policy chat_typing_presence_insert_policy on app_public.chat_typing_presence
  for insert
  with check (
    app_private.is_admin()
    or (
      account_id = app_private.current_account_id()
      and app_private.is_chat_participant(conversation_kind, conversation_id, app_private.current_account_id())
    )
  );

create policy chat_typing_presence_update_policy on app_public.chat_typing_presence
  for update
  using (
    app_private.is_admin()
    or (
      account_id = app_private.current_account_id()
      and app_private.is_chat_participant(conversation_kind, conversation_id, app_private.current_account_id())
    )
  )
  with check (
    app_private.is_admin()
    or (
      account_id = app_private.current_account_id()
      and app_private.is_chat_participant(conversation_kind, conversation_id, app_private.current_account_id())
    )
  );

grant execute on function app_private.is_chat_participant(app_public.chat_context_kind, uuid, uuid)
  to identified_account, admin;
grant select, insert on app_public.resource_conversation to identified_account, admin;
grant select, insert, update on app_public.resource_message to identified_account, admin;
grant select, insert on app_public.resource_message_image to identified_account, admin;
grant select, insert, update on app_public.chat_typing_presence to identified_account, admin;
grant select on app_public.chat_conversation_summary to identified_account, admin;

comment on view app_public.chat_conversation_summary is
  E'@name chatConversationSummaries\nRead model that lists both need and resource conversations per participant account.';

commit;
