# Research: Needs Querying And Claiming

## Decisions

### 1. Distance ranking model
- Use decimal `latitude` / `longitude` fields on both `app_public.need` and `app_public.account` for MVP distance scoring.
- Compute closeness in SQL with a haversine-style formula; avoid requiring PostGIS for this phase.
- Weighted total score:
  - closeness: **50%**
  - ease of setup: **30%**
  - expiration urgency: **20%**
- Tie-break order: `total_score DESC`, `created_at DESC`, `id ASC`.

### 2. Location fallback order
- Resolve query coordinates in this order:
  1. explicit query input
  2. signed-in account saved coordinates
  3. browser geolocation from the client
  4. Tournai city center defaults
- The backend should receive the final coordinates used so ranking stays deterministic and testable.

### 3. Accent-insensitive partial text search
- Use PostgreSQL `unaccent` normalization for creator name, title, description, tooling text, and competence text.
- Support partial matches with `ILIKE` on normalized text.
- Add trigram/functional indexes later for performance once the search shape is stable.

### 4. Claim lifecycle model
- Introduce a `need_claim_status` enum with: `open`, `settled`, `declined`, `withdrawn`, `expired`.
- Claim creation persists:
  - claimer account
  - need id
  - optional message
  - created timestamp
- Only the need creator can settle a claim.
- Settlement is atomic and also closes competing open claims.

### 5. Messaging model
- One conversation per claim.
- Conversation is created lazily when the need creator sends the first reply.
- If the original claim included a message, that message is inserted as the first conversation message when the thread is created.
- Read tracking is stored per message via `read_at`.
- Image attachments should be modeled as metadata/URLs rather than binary blobs in PostgreSQL.

### 6. Notification delivery for MVP
- Persist a creator-facing notification event when a claim is created.
- Surface it in the frontend with polling-based refresh (near-realtime) for MVP.
- This satisfies the product goal without introducing a new socket infrastructure mid-feature.

### 7. Expiry and cleanup behavior
- Query results exclude needs whose `expires_at <= now()`.
- Claim/settlement mutations also re-check the same active/not-expired conditions.
- A recurring worker job should sweep newly expired needs every 10 minutes and mark linked open claims as `expired`, while recording audit events and notifications.
