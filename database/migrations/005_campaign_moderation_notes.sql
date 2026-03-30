begin;

create table if not exists app_public.campaign_moderation_note (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references app_public.campaign(id) on delete cascade,
  manager_account_id uuid not null references app_public.account(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists campaign_moderation_note_campaign_created_idx
  on app_public.campaign_moderation_note (campaign_id, created_at);

alter table app_public.campaign_moderation_note enable row level security;

create policy campaign_moderation_note_select_policy on app_public.campaign_moderation_note
  for select
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  );

create policy campaign_moderation_note_insert_policy on app_public.campaign_moderation_note
  for insert
  with check (app_private.is_manager());

grant select on app_public.campaign_moderation_note to identified_account, manager, admin;
grant insert on app_public.campaign_moderation_note to manager, admin;

create or replace function app_public.add_campaign_moderation_note(
  campaign_id uuid,
  body text
)
returns app_public.campaign_moderation_note
language plpgsql
as $$
declare
  v_note app_public.campaign_moderation_note;
  v_manager_account_id uuid;
  v_campaign_status app_public.campaign_moderation_status;
begin
  if not app_private.is_manager() then
    raise exception using message = 'Only managers can add moderation notes';
  end if;

  v_manager_account_id := app_private.current_account_id();

  if v_manager_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select moderation_status
  into v_campaign_status
  from app_public.campaign
  where id = add_campaign_moderation_note.campaign_id;

  if v_campaign_status is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign_status <> 'pending' then
    raise exception using message = 'Moderation notes are allowed only for pending campaigns';
  end if;

  if length(trim(body)) = 0 then
    raise exception using message = 'Moderation note body is required';
  end if;

  insert into app_public.campaign_moderation_note (
    campaign_id,
    manager_account_id,
    body
  )
  values (
    add_campaign_moderation_note.campaign_id,
    v_manager_account_id,
    trim(add_campaign_moderation_note.body)
  )
  returning * into v_note;

  return v_note;
end;
$$;

grant execute on function app_public.add_campaign_moderation_note(uuid, text)
  to manager, admin;

comment on function app_public.add_campaign_moderation_note(uuid, text)
  is '@name addCampaignModerationNote';

commit;
