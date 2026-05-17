# Feature Specification: Account Deletion And Anonymization Policy

**Feature Branch**: `011-account-deletion-anonymization`  
**Created**: 2026-05-12  
**Status**: Draft  
**Input**: User direction to port and improve Tope-la account-deletion behavior for Mutuity: profile-level delete action with explicit confirmation, plus anonymization that preserves historical/public link integrity.

## Context

Tope-la currently implements account deletion as an anonymization-style mutation rather than hard row deletion. The observed SQL behavior clears identifying account fields and removes sensitive private data while preserving enough graph structure for historical references.

Mutuity should keep this intent but refine it with stricter policy boundaries and explicit public-state handling:

- Preserve referential continuity for bookmarked public URLs and historical records.
- Remove or irreversibly sever identifying private data.
- Surface a clear deleted state in public pages (consumed by feature `010-public-pages-and-seo`).

## Product Decisions Incorporated

- Deletion is initiated from profile settings.
- Delete button is visually mild (discoverable but not dominant).
- Confirmation requires explicit user intent (yes/no dialog + confirmation control).
- Deletion is implemented as anonymization/deactivation, not hard physical removal of all linked records.
- Conversations remain listing-contextual; this feature does not introduce account-level chat semantics.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Account Deletes Itself (Priority: P1)

As an authenticated account owner, I can delete my account from profile settings through a clear confirmation flow.

**Why this priority**: This is a privacy and trust-critical control.

**Independent Test**: Open profile settings, trigger delete flow, confirm action, verify session termination and post-delete state.

**Acceptance Scenarios**:

1. **Given** an authenticated account on profile settings, **When** the user views danger/settings section, **Then** a visually mild `Delete account` action is visible.
2. **Given** user clicks delete action, **When** confirmation dialog opens, **Then** dialog provides clear consequences and explicit cancel/confirm options.
3. **Given** dialog requires confirmation guard (toggle/checkbox/text-confirm), **When** guard is not satisfied, **Then** confirm action remains disabled.
4. **Given** user confirms deletion, **When** mutation succeeds, **Then** session is invalidated and user is redirected to a signed-out landing route.
5. **Given** deletion fails, **When** user remains on profile, **Then** a non-leaking error message is shown and no partial client-side sign-out occurs.

---

### User Story 2 - Public And Historical Links Remain Consultable (Priority: P1)

As a visitor or auditor, I can still open bookmarked public links after account deletion while seeing deleted-state indicators and non-identifying data.

**Why this priority**: Historical transparency must coexist with privacy protection.

**Independent Test**: Delete an account that owns public listings, then open account/listing URLs and verify readable but anonymized/deleted-safe rendering.

**Acceptance Scenarios**:

1. **Given** a deleted account with previously public listings, **When** a bookmarked listing URL is opened, **Then** page resolves and shows deleted-state UI.
2. **Given** deleted account page is opened, **When** profile data is rendered, **Then** identifying fields are removed/replaced with anonymized placeholders.
3. **Given** deleted account data is used for metadata generation, **When** crawlers request page HTML, **Then** metadata contains no identifying private data.
4. **Given** restricted/non-public records, **When** route is requested, **Then** existing visibility policy still applies with no leakage.

---

### User Story 3 - System Retains Integrity Without PII (Priority: P1)

As a platform operator, I preserve relational and financial/history integrity while removing identifying private information.

**Why this priority**: Hard deletion could break integrity; no deletion could violate privacy intent.

**Independent Test**: Delete account with resources/needs/campaign links and verify referential consistency, policy-safe rendering, and audit event creation.

**Acceptance Scenarios**:

1. **Given** an account has linked entities, **When** account is deleted, **Then** referential IDs remain valid for historical consultation.
2. **Given** private identifiers exist (email, password hash, recovery artifacts), **When** deletion runs, **Then** those values are nulled/cleared/invalidated.
3. **Given** public identity fields exist (display name, bio, avatar, links, location), **When** deletion runs, **Then** fields are removed or replaced by non-identifying placeholders.
4. **Given** deletion succeeds, **When** audit trail is inspected, **Then** a deletion/anonymization event is recorded with timestamp and actor context.

## UX Scope

Deletion UX must include:

- Placement in profile settings under a dedicated danger/privacy section.
- Mild visual emphasis (not primary CTA style used for core actions).
- Confirmation dialog with concise consequences and clear cancel path.
- Explicit confirmation guard before enabling final confirm.
- Loading/disabled state during mutation execution.

## Data Policy: Anonymization Contract

### Private Data (must be removed or invalidated)

- Email address
- Password hash/salt or equivalent credentials
- Recovery/reset tokens and expirations
- Active push tokens
- Pending email activations / verification artifacts
- Active sessions and refresh tokens

### Public Identity Data (must become non-identifying)

- Display name -> deterministic placeholder (for example `Deleted account` + short suffix)
- Avatar image reference -> removed
- Bio -> removed
- External links -> removed
- Location and precise geodata -> removed

### Historical/Relational Data (must remain structurally consistent)

- Stable account id and linked entity ids
- Listings and historical records (subject to visibility policy)
- Financial/ledger/event records
- Conversation and transaction references (policy-safe rendering)

## Security And Privacy Rules

- Deletion endpoint must be authenticated and self-scoped (no cross-account deletion).
- Operation must be idempotent and safe under retries.
- Mutation response and errors must not leak sensitive details.
- Post-deletion auth artifacts must be revoked immediately.
- Anonymization must be irreversible from application data alone.

## Publication And SEO Rules

- Deleted-visible pages must render explicit deleted flag/badge.
- SSR metadata for deleted accounts must use neutral templates and exclude identifying data.
- Feature `010` consumes these outputs for public page rendering.

## Data Retention Policy Inputs (Required)

This feature is the authoritative engineering source for retention behavior related to account deletion and anonymization.

### Retention Matrix

| Data category | Typical storage scope | Retention period | Retention trigger | End-of-retention action | Access scope |
|---|---|---|---|---|---|
| Account private identity fields (email, avatar source, bio, external links, location) | Primary application database | **0 days (immediate)** | `deleteAccount` mutation completes successfully | Remove or anonymize in-place per anonymization contract (executed synchronously during deletion) | Service role only during mutation execution |
| Auth credentials and sessions (password hash, refresh/session artifacts, push tokens) | Auth/session stores | **0 days (immediate)** | `deleteAccount` mutation completes successfully | Revoke and invalidate all active sessions/tokens (executed synchronously during deletion) | Auth/security services only |
| Public listing references owned by deleted account | Primary application database + public APIs | **Indefinite (policy-scoped)** | Account deletion completion | Keep policy-safe projection only with anonymized creator; remove identifying joins; governed by existing visibility policy | Public read for policy-safe fields only |
| Conversation content and message history | Primary application database | **90 days post-deletion** | Deletion execution timestamp + 90 days grace period | Purge or redact identifying references; preserve non-identifying message structure for audit/compliance trail | Participants + authorized moderation scope |
| Financial/ledger/event records | Ledger/event tables and archives | **7 years post-deletion** | Deletion execution timestamp + 7 years | Archive and retain for business/tax/regulatory compliance; never repurpose pre-delete account data for reconstruction | Restricted finance/compliance scope |
| Deletion audit evidence | Audit/event log pipeline | **3 years post-deletion** | Deletion execution timestamp + 3 years | Archive or purge per audit policy; retain non-identifying timestamps and hash-based identifiers for dispute resolution; clear PII fields | Restricted security/compliance scope |
| Backups and replicas containing pre-delete data | Backup infrastructure and replicas | **30 days post-deletion** | Backup creation before or after deletion event; natural TTL expiry | Natural expiry per backup retention window or expedited destruction upon SLA breach; includes disk snapshots, WAL archives, and replicated standby data | Infrastructure/security operators only |
| CDN/cache artifacts for public pages | CDN/edge cache and app cache | **15 minutes post-deletion** | Deletion completion triggers cache purge; secondary validation at 5-minute intervals if edge nodes remain stale | Immediate purge/invalidate keys for affected public routes (`/accounts/[id]`, `/needs?creatorId=`, `/campaigns?creatorId=`); fallback: TTL expiry if purge fails | Platform operations only |

### Operational Windows (Must Be Set Before Implementation Sign-Off)

- **Backup purge window SLA: 30 days maximum**  
  Deleted/anonymized data may persist in backups (full backup sets, WAL archives, replicated standby DBs) for up to 30 days post-deletion. This aligns with standard backup retention windows. After 30 days, backup sets containing pre-delete snapshots must be purged or destroyed per backup policy. Compliance: monitored via backup retention audit; alert if any backup set > 30 days old contains deleted account data.

- **Cache invalidation SLA: 5 minutes maximum (hard deadline) / 15 seconds target**  
  Public page cache must be purged within 5 minutes of deletion completion. Target invalidation time is 15 seconds (covers CDN edge TTL refresh + application cache layers). Affected routes: `/accounts/[id]`, `/needs?creatorId=[id]`, `/campaigns?creatorId=[id]`. Mechanism: deletion mutation triggers immediate cache purge via API; secondary validation at 1-minute and 5-minute marks if edges remain stale. Fallback: TTL expiry (typically 1 hour for public pages). Compliance: log all cache invalidations; alert if invalidation SLA breached or edge cache stale beyond 15 minutes.

- **Async cleanup SLA: 24 hours maximum**  
  Any background jobs required for retention matrix compliance (e.g., message history redaction jobs, backup purge jobs, audit log archival) must complete within 24 hours of deletion event. Priority: batch jobs run within 6 hours during low-traffic windows; critical jobs run immediately. Mechanism: scheduled jobs poll deletion audit log and apply retention actions per matrix. Compliance: monitor job execution dashboard; alert if any job exceeds 24-hour deadline or fails with non-transient error.

### Verification Expectations

- Each retention matrix row must map to at least one automated test or operational control.
- Audit payload checks must verify no direct identifying fields are emitted.
- Public rendering checks (feature `010`) must verify no leakage through HTML, metadata, structured data, or hydrated payloads.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Add profile-level `Delete account` action in a dedicated danger/privacy section.
- **FR-002**: Delete action must open a confirmation dialog with cancel and confirm actions.
- **FR-003**: Confirm action must require explicit confirmation guard before enabling execution.
- **FR-004**: Implement authenticated self-delete mutation that performs anonymization/deactivation semantics.
- **FR-005**: Private credentials and recovery artifacts must be cleared/invalidated on deletion.
- **FR-006**: Public identity fields must be anonymized or removed to prevent identification.
- **FR-007**: Referential integrity for historical/public links must be preserved.
- **FR-008**: All active sessions/tokens for deleted account must be revoked.
- **FR-009**: Deletion must emit audit event/log entry with timestamp and account context.
- **FR-010**: Deleted account state must be exposed through policy-safe fields consumed by feature `010`.
- **FR-011**: New copy for deletion UI and deleted-state messaging must be localized in EN and FR.
- **FR-012**: Deletion operation must be idempotent and safe under duplicate submission.

### Non-Functional Requirements

- **NFR-001**: Deletion flow should complete within acceptable UX bounds for profile operations.
- **NFR-002**: Mutation must remain robust under transient infrastructure errors and retries.
- **NFR-003**: Privacy protections must prevent recovery of identifying data from app-level APIs.

## Key Entities *(include if feature involves data)*

- **AccountDeletionCommand**: Authenticated mutation request to anonymize/deactivate the current account.
- **DeletedAccountPublicProjection**: Policy-safe public representation of deleted account identity.
- **DeletionAuditEvent**: Immutable event/log entry for deletion execution tracking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Account owner can delete account from profile with explicit confirmation flow.
- **SC-002**: Post-delete, account credentials/sessions are unusable.
- **SC-003**: Bookmarked public URLs remain resolvable where policy allows, with deleted-state indicators.
- **SC-004**: No identifying account data appears in public rendering or metadata after deletion.
- **SC-005**: Feature `010` public pages consume deleted-state outputs without regressions.

## Dependencies

- Public rendering/state model in feature `010-public-pages-and-seo`.
- Existing auth/session revocation infrastructure.
- Existing audit/logging pipeline.

## Out of Scope (for this spec)

- Full legal retention policy drafting.
- Physical hard-deletion workflows for all historical records.
- New conversation model semantics.
