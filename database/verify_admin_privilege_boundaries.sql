-- Read-only security contract after migrations 155-157: zero rows means PASS.
-- Use npm run guard:admin-boundaries for a nonzero exit on ANY violation.
-- This query is also executed by rollback-isolated regression tests. Catalog
-- checks complement, not replace, behavioral owner/participant isolation tests.
with
app_roles(role_name) as (values ('admin'), ('identified_account'), ('anonymous')),
privileges(privilege) as (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
  ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')),
scoped_tables(table_name, admin_privileges) as (values
  ('need_claim', array['SELECT']),
  ('claim_conversation', array['SELECT']),
  ('claim_message', array['SELECT']),
  ('claim_message_image', array['SELECT']),
  ('need_claim_settlement_event', array['SELECT']),
  ('resource_bid', array['SELECT']),
  ('campaign_resource', array['SELECT']),
  ('token_movement', array['SELECT']),
  ('account_delivery_preference', array['SELECT', 'INSERT', 'UPDATE']),
  ('need_claim_notification', array['SELECT', 'UPDATE']),
  ('resource_bid_notification', array['SELECT', 'UPDATE']),
  ('account_notification', array['SELECT', 'UPDATE']),
  ('resource_conversation', array['SELECT']),
  ('resource_message', array['SELECT']),
  ('resource_message_image', array['SELECT']),
  ('chat_typing_presence', array['SELECT'])
),
function_only_tables(table_name) as (values
  ('need_claim'), ('claim_conversation'), ('claim_message'), ('claim_message_image'),
  ('resource_conversation'), ('resource_message'), ('resource_message_image'), ('chat_typing_presence'),
  ('campaign_resource')
),
admin_functions(signature) as (values
  ('app_public.admin_list_accounts(text,integer,integer)'),
  ('app_public.admin_list_bids(text,integer,integer)'),
  ('app_public.admin_list_resources(text,integer,integer)'),
  ('app_public.admin_list_notifications(text,integer,integer)'),
  ('app_public.admin_list_mails(text,integer,integer)'),
  ('app_public.admin_list_campaigns(text,app_public.campaign_moderation_status,integer,integer)'),
  ('app_public.admin_list_grants(text,integer,integer)'),
  ('app_public.admin_list_logs(text,integer,integer)'),
  ('app_public.admin_get_mail_content(uuid)'),
  ('app_public.admin_resend_mail(uuid)'),
  ('app_public.add_campaign_moderation_note(uuid,text)'),
  ('app_public.approve_campaign(uuid)'),
  ('app_public.campaign_moderation_events(uuid)')
),
user_functions(signature, expected_definer) as (values
  ('app_public.link_campaign_resource(uuid,uuid)', true),
  ('app_public.unlink_campaign_resource(uuid,uuid)', true),
  ('app_public.accept_campaign_resource(uuid,uuid)', true),
  ('app_public.reject_campaign_resource(uuid,uuid)', true),
  ('app_public.request_account_email_change(text,bigint,bigint)', true),
  ('app_public.confirm_account_email_change(text)', true),
  ('app_public.claim_need(uuid,text)', true),
  ('app_public.settle_need_claim(uuid)', true),
  ('app_public.cancel_need_claim(uuid)', true),
  ('app_public.decline_need_claim(uuid)', true),
  ('app_public.send_claim_message(uuid,text,text[])', true),
  ('app_public.send_need_message(uuid,text,text[])', true),
  ('app_public.send_resource_message(uuid,text,text[])', true),
  ('app_public.send_resource_message_direct(uuid,uuid,text,text[])', true),
  ('app_public.send_claim_conversation_message(uuid,text,text[])', true),
  ('app_public.send_resource_conversation_message(uuid,text,text[])', true),
  ('app_public.mark_claim_messages_read(uuid)', true),
  ('app_public.mark_resource_messages_read(uuid)', true),
  ('app_public.upsert_chat_typing_presence(app_public.chat_context_kind,uuid)', true),
  ('app_public.list_chat_conversations(text,integer,integer)', true),
  ('app_public.count_chat_conversations(text)', true),
  ('app_public.count_unread_chat_conversations()', true)
),
required_functions(role_name, signature, expected_definer) as (
  select 'admin', signature, true from admin_functions
  union all
  select r.role_name, f.signature, f.expected_definer
  from user_functions f cross join (values ('admin'), ('identified_account')) r(role_name)
),
violations(category, object_name, detail) as (
  select 'admin_table_privilege', 'app_public.' || t.table_name, p.privilege
  from scoped_tables t cross join privileges p
  where has_table_privilege('admin', 'app_public.' || t.table_name, p.privilege)
    <> (p.privilege = any(t.admin_privileges))
  union all
  select 'unsafe_role', r.rolname, 'SUPERUSER or BYPASSRLS'
  from pg_roles r join app_roles a on a.role_name = r.rolname
  where r.rolsuper or r.rolbypassrls
  union all
  select 'unexpected_membership', 'admin/identified_account', 'roles must remain separate'
  where pg_has_role('admin', 'identified_account', 'MEMBER')
     or pg_has_role('identified_account', 'admin', 'MEMBER')
  union all
  select 'unsafe_table_rls', 'app_public.' || t.table_name, 'RLS disabled or missing table'
  from scoped_tables t left join pg_class c on c.oid = to_regclass('app_public.' || t.table_name)
  where c.oid is null or not c.relrowsecurity
  union all
  select 'table_owner_bypass', 'app_public.' || t.table_name, r.role_name
  from scoped_tables t join pg_class c on c.oid = to_regclass('app_public.' || t.table_name)
  cross join app_roles r where pg_has_role(r.role_name, c.relowner, 'USAGE')
  union all
  select 'raw_business_write', 'app_public.' || t.table_name, r.role_name || ':' || p.privilege
  from function_only_tables t cross join app_roles r cross join privileges p
  where p.privilege <> 'SELECT'
    and has_table_privilege(r.role_name, 'app_public.' || t.table_name, p.privilege)
  union all
  select 'summary_view_access', 'app_public.chat_conversation_summary', r.role_name || ':' || p.privilege
  from app_roles r cross join privileges p
  where has_table_privilege(r.role_name, 'app_public.chat_conversation_summary', p.privilege)
  union all
  select 'raw_write_policy', p.tablename, p.policyname
  from pg_policies p join function_only_tables t on t.table_name = p.tablename
  where p.schemaname = 'app_public' and p.cmd <> 'SELECT'
  union all
  -- This lexical check catches known bypass patterns; behavioral tests prove
  -- isolation and must still run if helper implementations or policies change.
  select 'role_policy_bypass', p.tablename, p.policyname
  from pg_policies p join scoped_tables t on t.table_name = p.tablename
  where p.schemaname = 'app_public'
    and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) ~* 'is_admin|is_manager|current_role'
  union all
  select 'required_function', f.signature, f.role_name || ': missing EXECUTE or wrong security mode'
  from required_functions f left join pg_proc p on p.oid = to_regprocedure(f.signature)
  where p.oid is null or not has_function_privilege(f.role_name, p.oid, 'EXECUTE')
    or p.prosecdef <> f.expected_definer
)
select category, object_name, detail from violations order by category, object_name, detail;