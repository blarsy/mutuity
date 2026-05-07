-- Enforce function-based admin access for shared domains.
--
-- Principle:
-- 1) Base-table RLS remains user/participant scoped.
-- 2) Cross-account admin visibility must be provided by explicit admin-only
--    Postgres functions with in-function role checks.
--
-- This migration removes is_manager() bypasses from bilateral/shared tables in
-- claims, bids, campaign-resource linkage, and participant-account helpers.

-- ---------------------------------------------------------------------------
-- Claims domain
-- ---------------------------------------------------------------------------

drop policy if exists account_claim_participant_select_policy on app_public.account;
create policy account_claim_participant_select_policy on app_public.account
  for select
  using (
    exists (
      select 1
      from app_public.need_claim nc
      join app_public.need n on n.id = nc.need_id
      where (
        nc.claimer_account_id = app_public.account.id
        and n.creator_account_id = app_private.current_account_id()
      )
      or (
        n.creator_account_id = app_public.account.id
        and nc.claimer_account_id = app_private.current_account_id()
      )
    )
  );

drop policy if exists need_claim_select_policy on app_public.need_claim;
create policy need_claim_select_policy on app_public.need_claim
  for select
  using (
    claimer_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists need_claim_update_policy on app_public.need_claim;
create policy need_claim_update_policy on app_public.need_claim
  for update
  using (
    claimer_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  )
  with check (
    claimer_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists claim_conversation_select_policy on app_public.claim_conversation;
create policy claim_conversation_select_policy on app_public.claim_conversation
  for select
  using (
    creator_account_id = app_private.current_account_id()
    or claimer_account_id = app_private.current_account_id()
  );

drop policy if exists claim_conversation_insert_policy on app_public.claim_conversation;
create policy claim_conversation_insert_policy on app_public.claim_conversation
  for insert
  with check (
    creator_account_id = app_private.current_account_id()
    or claimer_account_id = app_private.current_account_id()
  );

drop policy if exists claim_message_select_policy on app_public.claim_message;
create policy claim_message_select_policy on app_public.claim_message
  for select
  using (
    exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = conversation_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

drop policy if exists claim_message_insert_policy on app_public.claim_message;
create policy claim_message_insert_policy on app_public.claim_message
  for insert
  with check (
    sender_account_id = app_private.current_account_id()
  );

drop policy if exists claim_message_update_policy on app_public.claim_message;
create policy claim_message_update_policy on app_public.claim_message
  for update
  using (
    exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = conversation_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  )
  with check (
    exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = conversation_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

drop policy if exists claim_message_image_select_policy on app_public.claim_message_image;
create policy claim_message_image_select_policy on app_public.claim_message_image
  for select
  using (
    exists (
      select 1
      from app_public.claim_message cm
      join app_public.claim_conversation cc on cc.id = cm.conversation_id
      where cm.id = message_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

drop policy if exists claim_message_image_insert_policy on app_public.claim_message_image;
create policy claim_message_image_insert_policy on app_public.claim_message_image
  for insert
  with check (
    exists (
      select 1
      from app_public.claim_message cm
      join app_public.claim_conversation cc on cc.id = cm.conversation_id
      where cm.id = message_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

drop policy if exists need_claim_settlement_event_select_policy on app_public.need_claim_settlement_event;
create policy need_claim_settlement_event_select_policy on app_public.need_claim_settlement_event
  for select
  using (
    claimer_account_id = app_private.current_account_id()
    or settled_by_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Bids domain
-- ---------------------------------------------------------------------------

drop policy if exists account_resource_bid_participant_select_policy on app_public.account;
create policy account_resource_bid_participant_select_policy on app_public.account
  for select
  using (
    exists (
      select 1
      from app_public.resource_bid rb
      join app_public.resource r on r.id = rb.resource_id
      where (
        rb.bidder_account_id = app_public.account.id
        and r.creator_account_id = app_private.current_account_id()
      )
      or (
        r.creator_account_id = app_public.account.id
        and rb.bidder_account_id = app_private.current_account_id()
      )
    )
  );

drop policy if exists resource_bid_select_policy on app_public.resource_bid;
create policy resource_bid_select_policy on app_public.resource_bid
  for select
  using (
    bidder_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Campaign-resource linkage domain
-- ---------------------------------------------------------------------------

drop policy if exists campaign_resource_select_policy on app_public.campaign_resource;
create policy campaign_resource_select_policy on app_public.campaign_resource
  for select
  using (
    exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists campaign_resource_insert_policy on app_public.campaign_resource;
create policy campaign_resource_insert_policy on app_public.campaign_resource
  for insert
  with check (
    exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists campaign_resource_update_policy on app_public.campaign_resource;
create policy campaign_resource_update_policy on app_public.campaign_resource
  for update
  using (
    exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  )
  with check (
    exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  );
