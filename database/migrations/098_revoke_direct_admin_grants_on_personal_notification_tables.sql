-- Revoke direct admin table privileges on personal/notification tables.
--
-- Rationale:
-- - These tables represent per-account private data.
-- - Admin support use-cases are served through explicit admin functions
--   (security definer + app_private.is_admin() checks).
-- - Keeping direct table grants for admin encourages accidental broad queries.

revoke all privileges on app_public.need_claim_notification from admin;
revoke all privileges on app_public.resource_bid_notification from admin;
revoke all privileges on app_public.account_notification from admin;
revoke all privileges on app_public.token_movement from admin;
revoke all privileges on app_public.account_delivery_preference from admin;
