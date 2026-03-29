# Research: Campaign And Need Management

## Decisions

### 1. Authorization model
- Enforce authorization at the backend and database layers.
- Frontend should hide unavailable actions, but backend/API remains authoritative.
- Campaign approval and moderation-note creation are restricted to the `admin` / Mutuity manager role.
- Campaign need triage is restricted to the creator of the target campaign.

### 2. Visibility model
- Campaigns start in `pending` moderation status.
- Only `approved` campaigns are visible on public interfaces.
- Need-to-campaign linking is allowed only against campaigns that are approved and currently active.
- Needs themselves can exist independently from campaigns.

### 3. Validation model
- Campaign validation is synchronous at submission time.
- Required campaign fields: title, theme, rewards multiplier, start datetime, airdrop datetime, airdrop amount, end datetime.
- `rewards_multiplier` must be an integer in `[5, 10]`.
- `airdrop_amount` must be an integer in `[3000, 8000]`.
- Datetime constraints:
  - `start_at < end_at`
  - `start_at <= airdrop_at <= end_at`
- Need intensity must be one of `leg_up`, `sharing`, `commitment`, `rare_contribution`.
- If a proposed Topes amount is provided, it must match the intensity range.

### 4. Topes policy in Feature 1
- Proposed Topes amount is optional on needs.
- If omitted, later exchange can happen outside automatic token flow, for example through barter or gift discussion in claim messaging.
- If provided, the amount is validated against the intensity mapping:
  - `leg_up`: 10 to 99
  - `sharing`: 100 to 999
  - `commitment`: 1000 to 4999
  - `rare_contribution`: 5000 or more
- User-facing copy must avoid fiat equivalence and preserve social-gratitude framing.

### 5. State model
- Campaign moderation status:
  - `pending`
  - `approved`
- Campaign need relation status:
  - `pending`
  - `accepted`
  - `rejected`
- Duplicate moderation notes are acceptable and stored as separate chronological entries.

### 6. API style
- Use an API-first GraphQL design via PostGraphile.
- Business mutations with domain rules are implemented as SQL functions and exposed through PostGraphile.
- Existing REST-like contract examples are retained as behavioral references; implementation surface is GraphQL-first.

### 7. Recurring and asynchronous jobs
- Use Graphile Worker for recurring and asynchronous operations.
- Graphile Worker is responsible for recurring routines such as expiration-driven state updates and for resilient retryable background operations.
- Job handlers must be idempotent and auditable.

## Open Technical Choices
- Backend runtime: Node.js service hosting PostGraphile and Graphile Worker.
- API style: GraphQL-only for product operations, generated/exposed through PostGraphile.
- Final PostgreSQL implementation details such as enum types vs constrained text columns remain open, but constraints must be enforced at DB level.
