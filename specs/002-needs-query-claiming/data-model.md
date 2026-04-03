# Data Model: Needs Querying And Claiming

## Need location enrichment

### `app_public.need` additions
- `latitude`: numeric(9,6), required for searchable needs
- `longitude`: numeric(9,6), required for searchable needs
- `location`: existing human-readable label remains for display

### `app_public.account` additions
- `latitude`: numeric(9,6), nullable
- `longitude`: numeric(9,6), nullable
- Optional saved coordinates are used for authenticated search fallback.

## NeedQueryRequest
- `latitude`: number, optional
- `longitude`: number, optional
- `searchText`: string, optional
- `multiplePeopleRequired`: tri-state enum(`neutral`, `set`, `unset`)
- `toolingRequired`: tri-state enum(`neutral`, `set`, `unset`)
- `competenceRequired`: tri-state enum(`neutral`, `set`, `unset`)
- `objectRequired`: tri-state enum(`neutral`, `set`, `unset`)
- `limit`: integer, default `50`, max `50`

## NeedRankingScore
- `need_id`: UUID
- `closeness_score`: numeric
- `ease_of_setup_score`: numeric
- `expiration_score`: numeric
- `total_score`: numeric
- Derived only; not stored permanently.

### Rules
- `ease_of_setup_score` starts at `100`.
- Subtract `25` for each enabled flag among:
  - `tooling_required`
  - `competence_required`
  - `multiple_people_required`
- `object_required` participates in filtering but not in the defined ease-of-setup formula unless the spec is later expanded.

## NeedClaim
- `id`: UUID, primary key
- `need_id`: UUID, FK to `app_public.need`
- `claimer_account_id`: UUID, FK to `app_public.account`
- `message`: text, nullable
- `status`: enum(`open`, `settled`, `declined`, `withdrawn`, `expired`)
- `created_at`: timestamptz
- `updated_at`: timestamptz
- `settled_at`: timestamptz, nullable
- `settled_by_account_id`: UUID, nullable

### Rules
- One account may claim many needs.
- A need may receive multiple open claims until one is settled.
- Settlement is idempotent: once a claim is settled, it cannot be settled again.

## NeedClaimNotification
- `id`: UUID
- `recipient_account_id`: UUID
- `need_claim_id`: UUID
- `event_type`: enum/text such as `claim_created`, `claim_expired`, `claim_settled`
- `payload`: jsonb
- `created_at`: timestamptz
- `read_at`: timestamptz, nullable

## ClaimConversation
- `id`: UUID, primary key
- `need_claim_id`: UUID, unique FK to `NeedClaim`
- `need_id`: UUID, FK to `app_public.need`
- `creator_account_id`: UUID
- `claimer_account_id`: UUID
- `created_at`: timestamptz

### Rules
- Exactly two participants: the need creator and the claimer.
- Conversation is created on the first creator reply.

## ClaimMessage
- `id`: UUID, primary key
- `conversation_id`: UUID, FK to `ClaimConversation`
- `sender_account_id`: UUID, FK to `app_public.account`
- `body`: text, required
- `created_at`: timestamptz
- `read_at`: timestamptz, nullable

## ClaimMessageImage
- `id`: UUID, primary key
- `message_id`: UUID, FK to `ClaimMessage`
- `image_url`: text
- `sort_order`: integer
- `created_at`: timestamptz

## ClaimSettlement
- Implemented either as a dedicated table or settlement fields on `NeedClaim` plus an audit/event row.
- Required stored facts:
  - settled claim id
  - settling creator account id
  - settled timestamp
  - transferred Topes amount (0 when none)
  - optional transfer event reference
