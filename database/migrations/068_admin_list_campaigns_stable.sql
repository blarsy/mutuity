-- The 4-parameter overload of admin_list_campaigns introduced in migration 066
-- was never marked STABLE.  PostGraphile requires STABLE (or IMMUTABLE) for
-- set-returning functions to be exposed as Query fields rather than mutations.

alter function app_public.admin_list_campaigns(
  text,
  app_public.campaign_moderation_status,
  integer,
  integer
) stable;
