-- Fix resource_default_token_amount_matches_intensity: allow 'leg_up' for 1-99
-- This migration must be applied after 010_resource_discovery.sql

alter table app_public.resource
drop constraint if exists resource_default_token_amount_matches_intensity;

alter table app_public.resource
add constraint resource_default_token_amount_matches_intensity check (
  default_token_amount is null
  or (intensity = 'leg_up' and default_token_amount between 1 and 99)
  or (intensity = 'sharing' and default_token_amount between 100 and 999)
  or (intensity = 'commitment' and default_token_amount between 1000 and 4999)
  or (intensity = 'rare_contribution' and default_token_amount >= 5000)
);
