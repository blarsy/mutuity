begin;

create index if not exists need_claim_settled_by_account_id_idx
  on app_public.need_claim (settled_by_account_id);

create index if not exists claim_conversation_creator_account_id_idx
  on app_public.claim_conversation (creator_account_id);

create index if not exists claim_conversation_claimer_account_id_idx
  on app_public.claim_conversation (claimer_account_id);

create index if not exists claim_conversation_need_id_idx
  on app_public.claim_conversation (need_id);

create index if not exists claim_message_sender_account_id_idx
  on app_public.claim_message (sender_account_id);

create index if not exists need_claim_settlement_event_settled_by_account_id_idx
  on app_public.need_claim_settlement_event (settled_by_account_id);

create index if not exists need_claim_settlement_event_claimer_account_id_idx
  on app_public.need_claim_settlement_event (claimer_account_id);

create index if not exists resource_bid_responded_by_account_id_idx
  on app_public.resource_bid (responded_by_account_id);

create index if not exists token_movement_counterparty_account_id_idx
  on app_public.token_movement (counterparty_account_id);

create index if not exists need_claim_notification_need_claim_id_idx
  on app_public.need_claim_notification (need_claim_id);

commit;
