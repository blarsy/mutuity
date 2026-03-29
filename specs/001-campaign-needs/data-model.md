# Data Model: Campaign And Need Management

## Schema And Exposure Conventions
- Use dedicated PostgreSQL schemas to separate API-exposed objects from internal tables/functions.
- Use grants and Row Level Security as the primary authorization mechanism consumed by PostGraphile.
- Expose domain mutations through SQL functions rather than ad hoc app-layer write logic.
- Ensure SQL functions that can be invoked by PostGraphile are explicit about role checks and side effects.

## Campaign
- `id`: UUID, primary key
- `creator_account_id`: UUID, foreign key to accounts
- `title`: text, required
- `theme`: text, required
- `manager_note_from_creator`: text, nullable
- `rewards_multiplier`: integer, required, constrained to 5..10
- `airdrop_amount`: integer, required, constrained to 3000..8000
- `start_at`: timestamptz, required
- `airdrop_at`: timestamptz, required
- `end_at`: timestamptz, required
- `moderation_status`: enum(`pending`, `approved`), required, default `pending`
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

### Rules
- `start_at < end_at`
- `start_at <= airdrop_at <= end_at`
- Public visibility requires `moderation_status = approved` and current time within campaign lifetime.

### PostGraphile Functions
- `approve_campaign(campaign_id uuid)` -> campaign
- `create_campaign(...)` -> campaign

## CampaignModerationNote
- `id`: UUID, primary key
- `campaign_id`: UUID, foreign key to campaigns
- `manager_account_id`: UUID, foreign key to accounts
- `body`: text, required
- `created_at`: timestamptz, required

### Rules
- Notes are append-only history.
- Duplicate note bodies are allowed.

### PostGraphile Functions
- `add_campaign_moderation_note(campaign_id uuid, body text)` -> campaign_moderation_note

## Need
- `id`: UUID, primary key
- `creator_account_id`: UUID, foreign key to accounts
- `title`: text, required
- `description`: text, nullable
- `location`: geography/point or normalized location reference, required
- `intensity`: enum(`leg_up`, `sharing`, `commitment`, `rare_contribution`), required
- `proposed_topes_amount`: integer, nullable
- `object_required`: boolean, required, default `false`
- `competence_required`: boolean, required, default `false`
- `tooling_required`: boolean, required, default `false`
- `multiple_people_required`: boolean, required, default `false`
- `required_competence_text`: text, nullable
- `required_tooling_text`: text, nullable
- `required_people_count`: integer, nullable
- `is_active`: boolean, required, default `true`
- `expires_at`: timestamptz, nullable
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

### Rules
- At least one nature flag may be set; any combination is allowed.
- `proposed_topes_amount` is optional.
- If `proposed_topes_amount` is present, it must satisfy:
  - `leg_up`: 10..99
  - `sharing`: 100..999
  - `commitment`: 1000..4999
  - `rare_contribution`: >= 5000

### PostGraphile Functions
- `create_need(...)` -> need

## CampaignNeed
- `campaign_id`: UUID, foreign key to campaigns
- `need_id`: UUID, foreign key to needs
- `status`: enum(`pending`, `accepted`, `rejected`), required, default `pending`
- `acted_by_account_id`: UUID, nullable, foreign key to accounts
- `acted_at`: timestamptz, nullable
- primary key: (`campaign_id`, `need_id`)

### Rules
- A need can be linked to zero or more campaigns only if product rules later allow it. For Feature 1, treat one explicit optional campaign association at creation time as the supported path.
- Only the creator of the campaign may transition `status` from `pending` to `accepted` or `rejected`.
- Linking to a campaign is valid only if campaign is approved and active.

### PostGraphile Functions
- `accept_campaign_need(campaign_id uuid, need_id uuid)` -> campaign_need
- `reject_campaign_need(campaign_id uuid, need_id uuid)` -> campaign_need

## Graphile Worker Jobs (Cross-Feature)
- Feature 1 does not require a recurring job to function.
- Worker integration is still established in this phase so later features can schedule recurring tasks (for example expiration-driven claim updates).

## Derived Views / Read Models

### PublicCampaignSummary
- `id`
- `title`
- `theme`
- `rewards_multiplier`
- `airdrop_amount`
- `start_at`
- `airdrop_at`
- `end_at`

Visibility:
- Only from approved campaigns.

### CreatorCampaignModerationView
Includes:
- campaign core fields
- moderation status
- ordered moderation notes
- linked needs with triage status
