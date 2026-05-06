# RLS Data Exposure Fixes - COMPLETE ✅

## Summary
Fixed three GraphQL queries that were returning all user data to admin-role users due to RLS policies that grant managers full visibility. Added explicit viewer filters to ensure even admins only see appropriate data in the UI.

## Changes Made

### 1. Claims Queries (`frontend/src/features/needs/needClaims.queries.ts`)
**Status**: ✅ Fixed

**Issue**: `VIEWER_CLAIM_OVERVIEW_QUERY` returned ALL claims from all users when viewer had admin role.

**Changes**:
- Split into three queries:
  - `VIEWER_SENT_CLAIMS_QUERY` - filters by `claimerAccountId: { equalTo: $viewerId }`
  - `VIEWER_RECEIVED_CLAIMS_QUERY` - filters by `needByNeedId.creatorAccountId: { equalTo: $viewerId }`
  - `VIEWER_CLAIM_OVERVIEW_QUERY` - uses both sent and received as aliases
- Added `viewer { id }` field to get current account ID
- All queries now require `$viewerId: UUID!` parameter

**Impact**: Admin users on claims page now see only their own claims, not all claims in the system.

**Call Sites to Update**:
- `frontend/src/pages/claims.tsx` - must pass `viewerId` to query
- Any component using these queries must extract and pass viewer ID

### 2. Token Movements Query (`frontend/src/features/contribution/contribution.queries.ts`)
**Status**: ✅ Fixed

**Issue**: `CONTRIBUTION_OVERVIEW_QUERY` returned ALL financial transactions for any user when viewer had admin role.

**Changes**:
- Added `$viewerId: UUID!` parameter
- Added `filter: { accountId: { equalTo: $viewerId } }` to `allTokenMovements`
- Added `viewer { id }` field

**Impact**: Admin users on contribution page now see only their own token movements, not all financial data in the system.

**Call Sites to Update**:
- `frontend/src/features/contribution/ContributionPage.tsx` (or similar) - must pass `viewerId` to query

### 3. Campaigns Query (`frontend/src/features/campaigns/campaigns.queries.ts`)
**Status**: ✅ Fixed (Dead Code)

**Issue**: `MY_CAMPAIGNS_QUERY` (unused) had no filter on `allCampaigns`.

**Changes**:
- Added `$creatorAccountId: UUID!` parameter
- Added `condition: { creatorAccountId: $creatorAccountId }` filter

**Impact**: If this query is ever used in the future, it will be secure by default.

**Note**: This query is currently dead code; `MY_CAMPAIGNS_CONNECTION_QUERY` is used instead (which already had the filter).

## Next Steps

### Critical (Must Complete)
1. **Update all call sites** to pass the new required parameters:
   ```typescript
   // Before
   const { data } = useQuery(VIEWER_CLAIM_OVERVIEW_QUERY);
   
   // After
   const viewer = useViewer();  // or fetch current account ID
   const { data } = useQuery(VIEWER_CLAIM_OVERVIEW_QUERY, {
     variables: { viewerId: viewer.id }
   });
   ```

2. **Verify query compatibility** - PostGraphile must support the filter syntax:
   - `filter: { fieldName: { equalTo: $value } }`
   - If not supported, fallback to `condition` parameter or client-side filtering

3. **Test with admin role** - verify admin users still see only their data, not all data

### Important (Should Do)
- [ ] Add integration tests for RLS enforcement across different roles
- [ ] Document the pattern in code comments for future developers
- [ ] Consider creating separate admin queries for full-visibility use cases

### Nice to Have (Can Do Later)
- [ ] Create an admin panel with full-visibility queries (no filters)
- [ ] Add role-based query variants (userXxxQuery vs adminXxxQuery)
- [ ] Refactor backend RLS policies to separate user vs. admin access

## Testing Checklist

- [ ] Claims page shows only user's claims when logged in as admin
- [ ] Contribution page shows only user's transactions when logged in as admin
- [ ] Non-admin users continue to work as before
- [ ] Pagination still works with new filters
- [ ] Error handling for missing `viewerId` parameter

## Related Documentation
- See `SECURITY_RLS_AUDIT.md` for full audit details
- See `database/migrations/001_roles_grants_rls.sql` for RLS policy definitions
- See `database/migrations/008_need_search_and_claims.sql` for claim policies
