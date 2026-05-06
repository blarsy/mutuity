# RLS `is_manager()` Audit Report

## Issue Summary
Multiple RLS policies use `app_private.is_manager()` to grant managers/admins full visibility to all user data. This is intentional for audit purposes but breaks the frontend UI assumption that logged-in users see only their own data.

**Root Cause**: Admin roles bypass row-level security and see all records. Frontend queries don't add explicit filters, so admins see all claims, needs, campaigns, etc.

## Affected Tables & Frontend Queries

### 🔴 HIGH PRIORITY (User-Facing Data Breaches)

#### 1. **app_public.need_claim** (Migration 008)
- **RLS**: `is_manager()` grants full visibility
- **Frontend Impact**: `allNeedClaims` query returns ALL claims from all users
- **Affected Files**: `frontend/src/features/needs/needClaims.queries.ts`
- **Status**: ✅ FIXED - Added explicit `claimerAccountId` and need creator filters
- **Related Tables**:
  - `claim_conversation` - managers see all conversations
  - `claim_message` - managers see all messages  
  - `need_claim_notification` - managers see all notifications

#### 2. **app_public.need** (Migration 002)
- **RLS**: `is_manager()` grants full visibility
- **Policy**: `need_select_policy` line 109-116
- **Frontend Impact**: `allNeeds` queries could expose all inactive needs
- **Related**: Managers can also UPDATE any need (policy line 117-131)
- **Audit**: ⚠️ TODO - Check which frontend queries fetch needs

#### 3. **app_public.campaign** (Migration 002)
- **RLS**: `is_manager()` grants full visibility
- **Policy**: `campaign_select_policy` line 91
- **Frontend Impact**: Managers see all campaigns (including pending/rejected)
- **Audit**: ⚠️ TODO - Check campaign visibility queries

#### 4. **app_public.campaign_need** (Migration 002)
- **RLS**: `is_manager()` grants full visibility
- **Policy**: `campaign_need_select_policy` line 141-152
- **Frontend Impact**: Managers see all campaign-need relationships
- **Related**: Managers can INSERT/UPDATE links (line 159-190)

#### 5. **app_public.token_movement** (Migration 016)
- **RLS**: `is_manager()` grants full visibility (line 33)
- **Policy**: `token_movement_select_policy`
- **Frontend Impact**: Managers see all financial transactions
- **Severity**: **CRITICAL** - Financial/audit data exposure
- **Audit**: ⚠️ TODO - Check which queries fetch token movements

### 🟡 MEDIUM PRIORITY (Admin/Preferences Data)

#### 6. **app_public.account_delivery_preferences** (Migration 048)
- **RLS**: `is_manager()` grants SELECT, UPDATE, DELETE on all records
- **Policies**: Lines 48, 56, 64, 68
- **Frontend Impact**: Managers can view/modify delivery preferences for all users
- **Audit**: ⚠️ TODO - Check admin settings queries

#### 7. **app_public.grant_target_account** (Migration 056)
- **RLS**: `is_manager()` only (line 91)
- **Frontend Impact**: Managers see all grant assignments
- **Audit**: Probably intentional for admin panel

### 🟢 INTENTIONAL (Audit/Admin Data)

#### 8. **app_private.operational_log** (Migration 055)
- **RLS**: `is_manager()` only
- **Purpose**: Audit logging - intentional manager visibility
- **No Frontend Exposure**: Private schema, not exposed via GraphQL

#### 9. **app_private.grants_schema** (Migration 056)
- **RLS**: `is_manager()` only
- **Purpose**: Admin/role management - intentional
- **No Frontend Exposure**: Gated by admin functions

## Function-Level Checks

Several backend functions also check `is_manager()` to bypass authorization:
- `campaign/add_campaign_moderation_note.sql` - Managers can add moderation notes to any campaign
- `campaign/approve_campaign.sql` - Managers can approve any campaign
- `notification/cleanup_read_notifications.sql` - Managers can cleanup notifications globally
- `resource/publish_resource.sql` - Managers can bypass resource publisher checks
- `resource/respond_to_resource_bid.sql` - Managers can respond to any bid

## Recommended Fixes

### Option A: Remove `is_manager()` from RLS (Breaking, requires auth refactor)
- Delete the `is_manager()` clause from user-facing table policies
- Create separate admin queries/tables for audit access
- Pros: Clean separation of user vs. admin views
- Cons: Major refactor, breaks existing admin features

### Option B: Add Explicit Frontend Filters (Recommended)
- All user-facing GraphQL queries must add explicit viewer filters
- Filters ensure even admins only see appropriate data in the UI
- Admins can access full data via separate admin panel queries
- Pros: Surgical fix, preserves audit access, cleaner UX
- Cons: Requires updating multiple frontend queries

### Option C: Hybrid Approach (Best)
- Keep `is_manager()` in RLS for audit/admin features
- Create role-specific query variants:
  - `userAllNeedClaims(viewerId: UUID!)` - filters by viewer
  - `adminAllNeedClaims()` - no filter, managers only
- Backend validates role before returning admin data
- Pros: Supports both user and admin workflows
- Cons: Duplicates queries

## Action Items

### Immediate (Security)
- [x] Fix `allNeedClaims` - add explicit claimerAccountId filter
- [ ] Fix `allNeeds` - audit which queries use this
- [ ] Fix `allCampaigns` - audit which queries use this
- [ ] Fix `allTokenMovements` - audit financial data exposure

### Short Term (COMPLETE) ✅
- [x] Audit all GraphQL queries in `frontend/src/**/*.queries.ts` for unfiltered manager visibility
- [x] Fix `VIEWER_CLAIM_OVERVIEW_QUERY` - split into sent/received with explicit `claimerAccountId` filter
- [x] Fix `VIEWER_SENT_CLAIMS_QUERY` - added `$viewerId: UUID!` parameter
- [x] Fix `VIEWER_RECEIVED_CLAIMS_QUERY` - added `$viewerId: UUID!` parameter
- [x] Fix `CONTRIBUTION_OVERVIEW_QUERY` - add `accountId` filter for token movements
- [x] Fix `MY_CAMPAIGNS_QUERY` (dead code) - add `creatorAccountId` filter for safety
- [x] Update all call sites to pass `viewerId` parameter:
  - [x] `frontend/src/pages/claims.tsx` - passes `session.account?.id`
  - [x] `frontend/src/pages/contribution.tsx` - passes `session.account?.id` + added `useAuth()` import
  - [x] `frontend/src/features/needs/PublicNeedsPage.tsx` - passes `session.account?.id`

## Vulnerable Frontend Queries (Audit Results)

### 🔴 CRITICAL

#### `frontend/src/features/contribution/contribution.queries.ts`
- **Query**: `CONTRIBUTION_OVERVIEW_QUERY` (line 12)
- **Issue**: `allTokenMovements` has NO FILTER
- **Risk**: Admin sees ALL user financial transactions
- **Fix**: Add `accountId: { eq: $viewerId }` filter
- **Impact**: 🔴 Financial/Privacy Data Breach

### 🟡 MEDIUM (Dead Code)

#### `frontend/src/features/campaigns/campaigns.queries.ts`
- **Query**: `MY_CAMPAIGNS_QUERY` (line 38) 
- **Issue**: `allCampaigns(orderBy: CREATED_AT_DESC)` - NO FILTER
- **Risk**: Would expose all campaigns if used by admin
- **Status**: ⚠️ DEAD CODE - not used in codebase
- **Fix**: Either delete or add `condition: { creatorAccountId: $viewerId }` for safety

### 🟢 SAFE (Already Have Filters)

#### `frontend/src/features/campaigns/campaigns.queries.ts`
- `MY_CAMPAIGNS_CONNECTION_QUERY` (line 81) ✅ Has `creatorAccountId` filter
- `PUBLIC_CAMPAIGNS_QUERY` (line 54) ✅ Has `moderationStatus: APPROVED` filter
- `INSPIRATION_CAMPAIGNS_QUERY` (line 107) ✅ Has `moderationStatus: APPROVED` filter

#### `frontend/src/features/needs/needs.queries.ts`
- `MY_NEEDS_CONNECTION_QUERY` (line 192+) ✅ Has `creatorAccountId` filter

### Medium Term
- [ ] Consider creating a separate admin panel with full visibility
- [ ] Refactor RLS policies to separate user vs. admin access
- [ ] Add automated tests for RLS policy enforcement across roles

## Testing

Add to test suite:
```typescript
// Verify admin accessing user page doesn't see all records
test("admin user on claims page sees only own claims", async () => {
  const adminSession = await loginAs(admin);
  const response = await gqlRequest(adminSession, VIEWER_CLAIM_OVERVIEW_QUERY, {
    viewerId: admin.id  // Explicit filter
  });
  // Verify only admin's own claims returned
  expect(response.sentNeedClaims.nodes.every(c => 
    c.claimerAccountId === admin.id
  )).toBe(true);
});
```

## Related CVEs & Best Practices
- CWE-639: Authorization Bypass Through User-Controlled Key
- OWASP: Broken Access Control (A1)
- PostgreSQL RLS best practice: Separate audit/admin schemas from user-facing ones
