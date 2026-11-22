-- NeedById includes campaignNeedsByNeedId for anonymous visitors. Allow the
-- query to execute while retaining owner-only submission/feedback visibility.
-- Migration 166 replaced the earlier public campaign_need SELECT policy with
-- owner-only RLS, so anonymous visitors see an empty connection. No writes or
-- row-level policies change.
begin;
grant select on app_public.campaign_need to anonymous;
commit;