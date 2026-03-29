begin;

create type app_public.campaign_moderation_status as enum ('pending', 'approved');
create type app_public.need_intensity as enum ('leg_up', 'sharing', 'commitment', 'rare_contribution');
create type app_public.campaign_need_status as enum ('pending', 'accepted', 'rejected');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists app_public.campaign (
  id uuid primary key default gen_random_uuid(),
  creator_account_id uuid not null references app_public.account(id),
  title text not null,
  theme text not null,
  manager_note_from_creator text,
  rewards_multiplier integer not null,
  airdrop_amount integer not null,
  start_at timestamptz not null,
  airdrop_at timestamptz not null,
  end_at timestamptz not null,
  moderation_status app_public.campaign_moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_dates_valid check (
    start_at < end_at
    and airdrop_at >= start_at
    and airdrop_at <= end_at
  )
);

create trigger trg_campaign_set_updated_at
  before update on app_public.campaign
  for each row
  execute function app_private.set_updated_at();

create table if not exists app_public.need (
  id uuid primary key default gen_random_uuid(),
  creator_account_id uuid not null references app_public.account(id),
  title text not null,
  description text,
  location text not null,
  intensity app_public.need_intensity not null,
  proposed_topes_amount integer,
  object_required boolean not null default false,
  competence_required boolean not null default false,
  tooling_required boolean not null default false,
  multiple_people_required boolean not null default false,
  required_competence_text text,
  required_tooling_text text,
  required_people_count integer,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint need_people_count_valid check (
    required_people_count is null or required_people_count > 0
  )
);

create trigger trg_need_set_updated_at
  before update on app_public.need
  for each row
  execute function app_private.set_updated_at();

create table if not exists app_public.campaign_need (
  campaign_id uuid not null references app_public.campaign(id) on delete cascade,
  need_id uuid not null references app_public.need(id) on delete cascade,
  status app_public.campaign_need_status not null default 'pending',
  acted_by_account_id uuid references app_public.account(id),
  acted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (campaign_id, need_id)
);

alter table app_public.campaign enable row level security;
alter table app_public.need enable row level security;
alter table app_public.campaign_need enable row level security;

create policy campaign_select_policy on app_public.campaign
  for select
  using (
    moderation_status = 'approved'
    or creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

create policy campaign_insert_policy on app_public.campaign
  for insert
  with check (
    creator_account_id = app_private.current_account_id()
    or app_private.is_admin()
  );

create policy campaign_update_policy on app_public.campaign
  for update
  using (
    creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  )
  with check (
    creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

create policy need_select_policy on app_public.need
  for select
  using (
    is_active
    or creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

create policy need_insert_policy on app_public.need
  for insert
  with check (
    creator_account_id = app_private.current_account_id()
    or app_private.is_admin()
  );

create policy need_update_policy on app_public.need
  for update
  using (
    creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  )
  with check (
    creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

create policy campaign_need_select_policy on app_public.campaign_need
  for select
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

create policy campaign_need_insert_policy on app_public.campaign_need
  for insert
  with check (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

create policy campaign_need_update_policy on app_public.campaign_need
  for update
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  )
  with check (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  );

grant select on app_public.campaign to anonymous, identified_account, manager, admin;
grant insert, update on app_public.campaign to identified_account, manager, admin;

grant select on app_public.need to anonymous, identified_account, manager, admin;
grant insert, update on app_public.need to identified_account, manager, admin;

grant select on app_public.campaign_need to identified_account, manager, admin;
grant insert, update on app_public.campaign_need to identified_account, manager, admin;

commit;
