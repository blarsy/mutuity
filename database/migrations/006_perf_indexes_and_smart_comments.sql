begin;

-- Suppress the auto-generated PostGraphile CRUD mutations for tables that have
-- dedicated app_public functions (create_campaign → @name createCampaign).
-- Without this, PostGraphile generates a second "CreateCampaignPayload" from
-- the built-in table "create" mutation, causing a type naming conflict warning.
comment on table app_public.campaign is
  E'@omit create\nCampaign submitted by an account and moderated before going live.';

-- Add missing FK indexes PostGraphile warns about (for reverse-relation reads).
create index if not exists need_creator_account_id_idx
  on app_public.need (creator_account_id);

create index if not exists campaign_need_need_id_idx
  on app_public.campaign_need (need_id);

create index if not exists campaign_need_acted_by_account_id_idx
  on app_public.campaign_need (acted_by_account_id);

create index if not exists campaign_moderation_note_manager_account_id_idx
  on app_public.campaign_moderation_note (manager_account_id);

commit;
