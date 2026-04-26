begin;

alter function app_public.admin_list_accounts(text, integer, integer) stable;
alter function app_public.admin_list_bids(text, integer, integer) stable;
alter function app_public.admin_list_resources(text, integer, integer) stable;
alter function app_public.admin_list_notifications(text, integer, integer) stable;
alter function app_public.admin_list_mails(text, integer, integer) stable;
alter function app_public.admin_list_campaigns(text, integer, integer) stable;
alter function app_public.admin_list_grants(text, integer, integer) stable;
alter function app_public.admin_list_logs(text, integer, integer) stable;

commit;
