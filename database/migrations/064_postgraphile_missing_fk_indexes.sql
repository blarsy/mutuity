begin;

create index if not exists operational_log_account_id_idx
  on app_public.operational_log (account_id);

create index if not exists grant_definition_created_by_account_id_idx
  on app_public.grant_definition (created_by_account_id);

create index if not exists grant_definition_linked_campaign_id_fk_idx
  on app_public.grant_definition (linked_campaign_id);

create index if not exists grant_claim_token_movement_id_idx
  on app_public.grant_claim (token_movement_id);

commit;
