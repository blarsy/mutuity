# Data Model: Campaign And Need Management

## Schema And Exposure Conventions
- Use dedicated PostgreSQL schemas to separate API-exposed objects from internal tables/functions.
- Use grants and Row Level Security as the primary authorization mechanism consumed by PostGraphile.
- Expose domain mutations through SQL functions rather than ad hoc app-layer write logic.
- Ensure SQL functions that can be invoked by PostGraphile are explicit about role checks and side effects.
- Authentication checks MUST be enforced at the RLS layer (via `current_user_id` or similar context). The PostGraphile `handleErrors` callback MUST sanitize error messages before returning them to the client (see Security & Error Handling Requirements in spec.md).

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
- `moderation_status`: enum(`pending`, `awaiting_adaptation`, `approved`), required, default `pending`
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

### Rules
- `start_at < end_at`
- `start_at <= airdrop_at <= end_at`
- Public visibility requires `moderation_status = approved` and current time within campaign lifetime.
- Sending an administrator moderation note transitions `moderation_status` to `awaiting_adaptation`.
- Creator edits are allowed only while `moderation_status` is `pending` or `awaiting_adaptation`.
- Once `moderation_status` becomes `approved`, the creator moderation surface becomes read-only and no new moderation events are appended.

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

## CampaignModerationEvent (Read Model Or Backed Table)
- `campaign_id`: UUID, foreign key to campaigns
- `event_type`: enum/text with values at least `campaign_created`, `moderation_note_received`, `campaign_modified_by_creator`
- `actor_account_id`: UUID, nullable, foreign key to accounts
- `body`: text, nullable
- `created_at`: timestamptz, required

### Rules
- Creator-facing moderation history is ordered by `created_at DESC`.
- The initial campaign creation MUST appear as the oldest synthetic or persisted moderation event.
- Administrator moderation notes appear as `moderation_note_received` events.
- Creator edits while the campaign is awaiting adaptation appear as `campaign_modified_by_creator` events.
- Campaign approval does not append a new moderation event; approval is communicated through status and notifications.

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
- `image_urls`: text[], nullable, default `array[]::text[]`
- `is_active`: boolean, required, default `true`
- `expires_at`: timestamptz, nullable
- `created_at`: timestamptz, required
- `updated_at`: timestamptz, required

### Rules
- At least one nature flag MUST be true; any combination is allowed.
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
- ordered moderation events (most recent first)
- editability flag derived from moderation status (`pending` or `awaiting_adaptation` only)
- linked needs with triage status

## NeedMilestoneReward (Trigger-Based)

Issued by a database trigger (`issue_need_milestone_rewards`) that fires on INSERT
and UPDATE of `app_public.need`. The trigger compares the OLD and NEW values of the
relevant columns to determine whether a milestone was just crossed for the first time.

### Milestones and amounts

| Milestone | Reward | Event Type | Idempotency Key |
|---|---|---|---|
| First image added (`image_urls` goes from empty to non-empty) | **10 Topes** | `need_first_image_reward` | `need:{id}:first-image` |
| First default Topes amount set (`proposed_topes_amount` goes from null to non-null) | **10 Topes** | `need_first_default_token_amount_reward` | `need:{id}:first-default-token-amount` |

### INSERT behavior

When a need is created with images already present, the OLD value is treated as empty
(no prior row), so the transition from empty to non-empty is detected and the reward
fires on insert. The same applies when a need is created with a non-null
`proposed_topes_amount`: the trigger treats the prior state as null and grants the
reward on insert.

### UPDATE behavior

When a need is updated and the relevant column transitions from empty/null to
non-empty/non-null for the first time, the reward fires. Subsequent updates that
keep the column non-empty/non-null do not trigger the reward again.

### Rules
- Each milestone is idempotent per need: the reward fires at most once per need
  regardless of how many times the field is updated afterward.
- Rewards are issued atomically within the same transaction as the need insert/update.
- The need creator account receives the Topes via `app_private.create_token_movement`.

