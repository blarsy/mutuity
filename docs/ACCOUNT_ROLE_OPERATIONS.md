# Account role operations

## Promote an account to campaign administrator

Campaign approval requires the account-level `admin` role. The supported account roles are `identified_account` and `admin`; `manager` is a retired legacy role, not a role to assign. Role authority lives in `app_public.account.role_name`, not in `app_private.account_credential.role_name` or in a PostgreSQL `GRANT`.

Only an authorized database operator should perform this change, using the approved secure connection to the correct Mutuity database. Identify the account by its account UUID, obtained from a trusted source. Do not select a target based only on a display name or email address.

In a database session, replace `ACCOUNT_UUID` in both statements with the verified UUID, then run:

```sql
BEGIN;

SELECT id, display_name, role_name
FROM app_public.account
WHERE id = 'ACCOUNT_UUID'::uuid
FOR UPDATE;
```

Confirm this returns exactly the intended account. If it does not, run `ROLLBACK` and stop. If the role is already `admin`, no change is needed. Otherwise, continue in the same transaction:

```sql
UPDATE app_public.account
SET role_name = 'admin'
WHERE id = 'ACCOUNT_UUID'::uuid
  AND role_name = 'identified_account'
RETURNING id, display_name, role_name;
```

Commit only if this returns exactly one row for the verified account, with `role_name = 'admin'`; otherwise run `ROLLBACK` and investigate. After committing, verify the account's role. Changing the role revokes that account's active sessions, so the person must sign in again before acting as an administrator.

Campaign approval is performed through the application's `approveCampaign` action. The database function permits approval only for campaigns currently in `pending` or `awaiting_adaptation` status; it records a moderation event and notifies the creator. See [the campaign approval migration](../database/migrations/074_campaign_moderation_approval_event.sql) and [the account role migration](../database/migrations/154_account_level_authorization_roles.sql).

## Important constraints

- Do not update `app_private.account_credential.role_name`; it is a deprecated compatibility field and is not authoritative.
- Do not run `GRANT manager` or assign `manager`; that PostgreSQL role was retired. This procedure changes an application's account role, not PostgreSQL role membership.
- To remove administrator access, set `app_public.account.role_name` back to `identified_account` using the same verified-UUID and transaction safeguards. The role change revokes active sessions as well.
