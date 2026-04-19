begin;

-- Add single-column indexes so PostGraphile can expose timestamp orderBy enums.
create index if not exists campaign_start_at_idx
  on app_public.campaign (start_at);

create index if not exists campaign_created_at_idx
  on app_public.campaign (created_at);

create index if not exists campaign_need_created_at_idx
  on app_public.campaign_need (created_at);

create index if not exists campaign_moderation_note_created_at_idx
  on app_public.campaign_moderation_note (created_at);

commit;
