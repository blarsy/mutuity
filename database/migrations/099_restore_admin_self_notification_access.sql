-- Restore admin access to personal notification tables for self-scoped UX.
--
-- Rationale:
-- - Migration 098 revoked all direct admin table privileges, which blocks
--   admin accounts from using the standard notifications page entirely.
-- - RLS policies on these tables are already strictly recipient-scoped
--   (recipient_account_id = current_account_id), so granting table privileges
--   does not reintroduce cross-account visibility.

grant select, update on app_public.need_claim_notification to admin;
grant select, update on app_public.resource_bid_notification to admin;
grant select, update on app_public.account_notification to admin;
