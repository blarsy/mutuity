-- Migration 066 created a new 4-parameter overload of admin_list_campaigns
-- instead of replacing the old 3-parameter one (PostgreSQL treats a changed
-- signature as a new function).  PostGraphile cannot expose two functions with
-- the same @name smart comment, causing the field to vanish from the schema.
-- Drop the old overload so only the new signature remains.

drop function if exists app_public.admin_list_campaigns(text, integer, integer);
