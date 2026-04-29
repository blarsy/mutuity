create index if not exists campaign_moderation_event_actor_account_id_idx
  on app_public.campaign_moderation_event (actor_account_id);