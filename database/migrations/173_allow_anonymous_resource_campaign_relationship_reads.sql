-- ResourceById includes campaignResourcesByResourceId, even for visitors.
-- Without SELECT, PostgreSQL aborts the entire detail query before RLS can
-- filter the relationship. Permit the read, not access to submission rows:
-- campaign_resource_select_policy still requires ownership of the resource
-- or campaign. Anonymous visitors see an empty connection, never private
-- submission history or rejection notes. No write grants or policies change.

begin;

grant select on app_public.campaign_resource to anonymous;

commit;