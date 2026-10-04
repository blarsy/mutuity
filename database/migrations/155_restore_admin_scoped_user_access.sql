begin;

-- Admins can use ordinary app reads as participants, without inheriting the
-- identified_account role or its raw claim/chat write privileges. Policies from
-- migrations 094-096 still enforce recipient/owner/participant row isolation.
grant select on
  app_public.resource_bid,
  app_public.token_movement,
  app_public.campaign_resource,
  app_public.claim_conversation,
  app_public.claim_message,
  app_public.claim_message_image,
  app_public.need_claim_settlement_event
to admin;

-- All three policies on this table check current_account_id(), including the
-- UPDATE WITH CHECK that prevents transferring a preference to another account.
grant select, insert, update on app_public.account_delivery_preference to admin;

-- Intentionally no role membership, claim/chat DML grants, policy bypasses,
-- or changes to existing administrative functions.
commit;