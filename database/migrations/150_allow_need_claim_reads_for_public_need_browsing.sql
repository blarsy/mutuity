-- Fix "current transaction is aborted" errors when browsing needs.
--
-- app_public.need grants SELECT to anonymous/identified_account/admin, but
-- app_public.need_claim (queried via needClaimsByNeedId on every need row in
-- the search/browse screens) only grants SELECT to identified_account. Any
-- anonymous or admin request that touches needClaimsByNeedId therefore hits
-- "permission denied for table need_claim", which aborts the shared
-- PostGraphile request transaction and makes unrelated concurrent root
-- fields (e.g. publicCampaignNeedLinks) fail with
-- "current transaction is aborted, commands ignored until end of transaction block".
--
-- need_claim_select_policy already scopes visible rows to the claimer or the
-- need's creator, so granting SELECT here does not expose any additional
-- rows: anonymous requests simply see zero claim rows.

begin;

grant select on app_public.need_claim to anonymous, admin;

commit;
