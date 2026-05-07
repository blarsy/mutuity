-- Revoke direct admin table privileges on shared-domain tables.
--
-- Admin access in these domains must go through explicit admin-only functions
-- (security definer + in-function app_private.is_admin() checks), not through
-- direct table grants combined with permissive RLS policies.

revoke all privileges on app_public.need_claim from admin;
revoke all privileges on app_public.claim_conversation from admin;
revoke all privileges on app_public.claim_message from admin;
revoke all privileges on app_public.claim_message_image from admin;
revoke all privileges on app_public.need_claim_settlement_event from admin;
revoke all privileges on app_public.resource_bid from admin;
revoke all privileges on app_public.campaign_resource from admin;
