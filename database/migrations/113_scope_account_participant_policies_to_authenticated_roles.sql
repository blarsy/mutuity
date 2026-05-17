-- Scope account participant policies to authenticated roles only.
--
-- These policies reference shared-domain tables (need_claim/resource_bid).
-- Leaving them as default TO public makes anonymous reads evaluate subqueries
-- against tables anonymous cannot access, causing permission errors in public
-- detail pages that join account rows.

begin;

drop policy if exists account_claim_participant_select_policy on app_public.account;
create policy account_claim_participant_select_policy on app_public.account
  for select
  to identified_account, admin
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

drop policy if exists account_resource_bid_participant_select_policy on app_public.account;
create policy account_resource_bid_participant_select_policy on app_public.account
  for select
  to identified_account, admin
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

commit;
