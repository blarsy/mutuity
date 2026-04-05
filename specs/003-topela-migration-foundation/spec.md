# Feature Specification: Tope-là Migration And Mutuity Merge Foundation

**Feature Branch**: `003-topela-migration-foundation`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "Reverse-engineer Tope-là into specs, migrate it to SpecKit + AI-driven development, and merge Mutuity into the same unified product while preserving the existing look & feel."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Team Defines A Unified Product Scope (Priority: P1)

As the product and technical lead, I can inventory Tope-là and Mutuity capabilities so the merged platform has a clear target scope, glossary, and non-goals.

**Why this priority**: Without a shared scope definition, the merge effort will drift and produce architecture churn.

**Independent Test**: Review the migration documents and verify they identify the current capabilities of both systems, the intended unified product boundaries, and the items explicitly deferred.

**Acceptance Scenarios**:

1. **Given** the current Tope-là and Mutuity repositories, **When** the audit is completed, **Then** the team has a capability inventory covering web, mobile, backend, data, auth, messaging, and admin features.
2. **Given** overlapping concepts such as needs, resources, claims, bids, and conversations, **When** the glossary is drafted, **Then** each concept has a proposed unified meaning or an explicit reason to remain distinct for MVP migration.
3. **Given** areas that should not be rebuilt immediately, **When** the scope is finalized, **Then** the documents list clear non-goals and postponements.

---

### User Story 2 - Team Reverse-Engineers Legacy Behavior Into SpecKit Features (Priority: P1)

As the delivery team, we can convert the legacy Tope-là product into feature specs, plans, and tasks so redevelopment can proceed slice by slice under SpecKit and AI assistance.

**Why this priority**: The old codebase should inform the new build, but not dictate a messy direct merge.

**Independent Test**: Starting from the migration foundation, the team can derive the first implementation-ready feature specs without needing to rediscover legacy behavior from source each time.

**Acceptance Scenarios**:

1. **Given** an important legacy flow such as resource publishing or messaging, **When** it is reverse-engineered, **Then** it becomes a documented feature slice with scope, constraints, tasks, and QA steps.
2. **Given** a legacy behavior that exists differently in Mutuity and Tope-là, **When** the team compares them, **Then** the plan captures which version becomes the MVP reference and why.
3. **Given** weak or missing tests in the legacy codebase, **When** the redevelopment starts, **Then** the new feature slices require explicit verification steps and fresh automated coverage.

---

### User Story 3 - Team Preserves Tope-là Look & Feel During Rebuild (Priority: P2)

As the product owner, I can preserve the current Tope-là visual identity and user experience while replacing the internal implementation with a cleaner unified platform.

**Why this priority**: Product continuity matters, but it should not force the new system to inherit legacy structural debt.

**Independent Test**: Compare the rebuilt slices against screenshots, assets, and behavioral references from the current product and confirm that the user experience remains recognizably equivalent.

**Acceptance Scenarios**:

1. **Given** the existing Tope-là web and mobile screens, **When** the new design system is mapped, **Then** the rebuild preserves the same visual language, assets, and interaction patterns where intended.
2. **Given** legacy components with weak internals, **When** the team rebuilds them, **Then** visual parity is retained without copying unsafe or low-quality implementation decisions.
3. **Given** new Mutuity capabilities such as needs and claims, **When** they are integrated into the unified product, **Then** they fit the Tope-là visual identity instead of appearing as a separate app bolted on top.

### Edge Cases

#### Identity and access
- A single person may act as an individual user, an organization representative, and an admin in different contexts; the merged platform must define which role wins in each action path => The distinction between individual user and organization has no purpose in the current state of the system, as Tope-là only operates on non-commercial exchanges. The admin accounts are standard accounts promoted by another admin account. Admin sections of the website are only shown to admins, and the admin-only actions check the caller's credentials, denying access to non-admins.
- Auth providers may not map cleanly between the two systems, creating duplicate accounts or orphaned profiles during migration => The first go-live of the merged product will start from an empty Mutuity database. So we will only migrate data from the Tope-là live database, which contains no duplicate. Accounts in the merged product will be able to create both resources and needs.
- Suspended, deleted, or inactive accounts may still own listings, messages, or notifications that must remain historically visible without restoring full access => Read notifications are auto-deleted after a rentention period (7 days at this time), conversations on resources or needs stay open indefinitely, the UI will reflect the fact that the resource or need status, so that the viewer knows what can be expected, but he can always chat

#### Domain overlap and state transitions
- A `resource` and a `need` may describe nearly the same real-world item or competence, but still require different response and settlement rules => They are distinct entities. They can be created in the UI using they respective pages / views
- One listing may attract multiple bids/claims, and the unified platform must preserve exactly which response closes, expires, or remains open in each lifecycle state => Bids and claims are different entities, though they have some similar fields and state transitions.
- Legacy status values may not map one-to-one into the target schema, especially around cancellation, expiration, refusal, and settlement. => When state transitions are not identical, they will be implemented apart

#### Messaging and notifications
- Conversations may need to remain readable, or sometimes writable, after the parent listing is closed, expired, or settled. => Yes conversations are never closed, except when an account is deleted (then, the other account can still see the whole conversation, but not send any more messages)
- Unread counts and push notifications may drift from persisted notification records when devices reconnect or background delivery fails => We favor responsiveness over accuracy when optimizing complicated notification flow (realtime notifications in particular)
- Deleting or archiving a listing must not accidentally destroy legally or operationally important message history => messages are never deleted, unless both accounts of the conversation are deleted

#### Media and assets
- Legacy uploads may reference missing or renamed Cloudinary/public asset identifiers => There should be regular, automated cleanup tasks that auto-delete orphaned uploads, and signal broken links to the external asset repository.
- Some records may contain image metadata or attachment conventions that differ between web and mobile implementations => all assets are stored in a mobile-friendly format, possibly constituting a lower resolution for larger screen
- The rebuild must preserve owned visual assets and branding while avoiding accidental dependency on legacy file naming or storage quirks => static assets are already stored on the codebase, while all user-created assets are already stored on an external repository. So this should be straightforward.

#### Migration and data mapping
- Live data may need to be preserved, but schema-level direct merging would introduce unnecessary risk and ambiguous mappings => The migration will populate a brand new database with live data. It should run one time in the product history from a backup taken just before shutting down the live legacy data store, and allow forgetting about the migration scripts and backups of the legacy data store.
- Some historical records may be incomplete, duplicated, or inconsistent, requiring transformation rules before import into the unified schema => careful manual inspection will be involved in testing the data migration, during simulated and actual migration
- Partial migration reruns must be idempotent so test imports and production cutovers do not create duplicate accounts, listings, or messages => Yet a migration is considered finished only when all scripts are run successfully, so the legacy system, once stopped for allowing migration, should always be quickly restorable to its state at stopping time.

#### Cross-platform and operational parity
- Mobile and web flows may diverge subtly for the same business capability and need explicit reconciliation before redevelopment begins.
- Legacy integrations such as push notifications, media storage, OAuth providers, worker jobs, and admin tools may need gradual migration rather than big-bang replacement.
- Some backoffice or campaign features may be useful later but should not block the first unified MVP unless they are proven operationally critical.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The initiative MUST treat Tope-là as the primary **product/UX reference** and Mutuity as the primary **architecture/process reference** for the unified platform.
- **FR-002**: The team MUST produce a documented inventory of existing Tope-là and Mutuity capabilities before starting merge implementation.
- **FR-003**: The migration plan MUST define a unified domain glossary covering accounts, organizations, resources, needs, claims/bids, conversations, notifications, campaigns, and media.
- **FR-004**: The plan MUST identify which concepts remain distinct in the first migration wave and which are candidates for later unification.
- **FR-005**: The redevelopment MUST follow a SpecKit-style workflow with feature specs, implementation plans, task lists, and verification steps.
- **FR-006**: The rebuild MUST preserve the existing Tope-là look & feel using owned or freely licensed assets, screenshots, and behavioral references.
- **FR-007**: The migration MUST prefer a clean-room redevelopment over a direct low-level merge of legacy schemas and application layers.
- **FR-008**: The target platform MUST support web, mobile, backend, and PostgreSQL-backed domain logic under a single coherent roadmap.
- **FR-009**: Business rules and permission-sensitive logic in the new platform MUST remain database-owned rather than scattered through client code.
- **FR-010**: The plan MUST include a phased migration sequence for accounts, listings, conversations, notifications, media, and operational/admin capabilities.
- **FR-011**: The migration MUST define how existing Tope-là data is mapped, transformed, or deferred before any production cutover.
- **FR-012**: The plan MUST explicitly identify non-goals so low-priority legacy complexity does not block the first unified MVP.
- **FR-013**: The team MUST add automated tests around newly rebuilt slices instead of relying on the legacy codebase as proof of correctness.
- **FR-014**: The migration MUST document major technical risks, including schema drift, auth divergence, realtime behavior, and mobile parity.
- **FR-015**: The first implementation wave MUST be decomposed into independently deliverable slices that can be validated one by one.

### Key Entities *(include if feature involves data)*

- **LegacyCapabilityInventory**: A structured record of existing Tope-là and Mutuity product features, surfaces, and supporting systems.
- **UnifiedDomainGlossary**: The canonical vocabulary for the merged platform and its initial entity boundaries.
- **MergeDecisionRecord**: The rationale for what is kept, replaced, postponed, or dropped.
- **VisualParityReference**: Screenshots, assets, and style guidance used to reproduce Tope-là’s user experience.
- **MigrationWave**: A planned delivery slice with scope, dependencies, risk level, and verification criteria.
- **DataMigrationMap**: The mapping between legacy Tope-là data and the target unified schema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Feature 003 documentation fully replaces the old external-API concept with a migration initiative that matches the new product direction.
- **SC-002**: The team can identify the first 3–5 implementation-ready feature slices for the unified platform directly from the new docs.
- **SC-003**: The migration plan explicitly documents scope, non-goals, domain mapping, risks, and phased rollout strategy.
- **SC-004**: The rebuild approach preserves Tope-là’s visual identity while avoiding a direct schema-and-code merge as the default strategy.
