-- verify_admin_privilege_boundaries.sql
--
-- Asserts that:
--   1. The `admin` role has NO direct table privileges on shared and personal-sensitive tables
--   2. The `admin` role has expected direct privileges on self-scoped notification tables
--   3. The `admin` role retains EXECUTE rights on all required admin functions
--
-- Run as a superuser or the migration role.
-- Each query should return 0 rows on a correctly configured database.
-- A non-empty result set means a boundary violation.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — Tables that admin must NOT have direct privileges on
-- ─────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '=== Section 1: admin must have NO direct table privileges on these tables ==='
\echo '    (expect 0 rows; any row is a violation)'
\echo ''

SELECT
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.role_table_grants
WHERE grantee = 'admin'
  AND table_schema = 'app_public'
  AND table_name IN (
      -- shared / bilateral domain
      'need_claim',
      'claim_conversation',
      'claim_message',
      'claim_message_image',
      'need_claim_settlement_event',
      'resource_bid',
      'campaign_resource',
      -- personal / sensitive
      'token_movement',
      'account_delivery_preference'
  )
ORDER BY table_name, privilege_type;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — Notification tables that admin MUST have self-scoped grants on
-- ─────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '=== Section 2: admin must have expected grants on self-scoped notification tables ==='
\echo '    (expect 0 rows; any row means a grant is missing or extra)'
\echo ''

WITH expected (table_name, privilege_type) AS (
    VALUES
        ('need_claim_notification', 'SELECT'),
        ('need_claim_notification', 'UPDATE'),
        ('resource_bid_notification', 'SELECT'),
        ('resource_bid_notification', 'UPDATE'),
        ('account_notification', 'SELECT'),
        ('account_notification', 'UPDATE')
),
actual AS (
    SELECT table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE grantee = 'admin'
      AND table_schema = 'app_public'
      AND table_name IN (
          'need_claim_notification',
          'resource_bid_notification',
          'account_notification'
      )
)
SELECT 'missing' AS issue, e.table_name, e.privilege_type
FROM expected e
LEFT JOIN actual a USING (table_name, privilege_type)
WHERE a.table_name IS NULL
UNION ALL
SELECT 'unexpected' AS issue, a.table_name, a.privilege_type
FROM actual a
LEFT JOIN expected e USING (table_name, privilege_type)
WHERE e.table_name IS NULL
ORDER BY 1, 2, 3;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 — Admin functions that must have EXECUTE granted to `admin`
-- ─────────────────────────────────────────────────────────────────────────────

\echo ''
\echo '=== Section 3: admin must have EXECUTE on all required admin functions ==='
\echo '    (expect 0 rows; any row means the grant is MISSING)'
\echo ''

WITH required_functions (routine_name) AS (
    VALUES
        ('admin_list_accounts'),
        ('admin_list_bids'),
        ('admin_list_resources'),
        ('admin_list_notifications'),
        ('admin_list_mails'),
        ('admin_list_campaigns'),
        ('admin_list_grants'),
        ('admin_list_logs'),
        ('admin_get_mail_content'),
        ('admin_resend_mail'),
        ('add_campaign_moderation_note'),
        ('approve_campaign'),
        ('campaign_moderation_events')
),
granted AS (
    SELECT routine_name
    FROM information_schema.role_routine_grants
    WHERE grantee       = 'admin'
      AND routine_schema = 'app_public'
      AND privilege_type = 'EXECUTE'
)
SELECT rf.routine_name AS missing_execute_grant
FROM required_functions rf
LEFT JOIN granted g USING (routine_name)
WHERE g.routine_name IS NULL
ORDER BY rf.routine_name;
