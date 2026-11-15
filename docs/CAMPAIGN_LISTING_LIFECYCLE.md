# Campaign listing submission lifecycle

This document describes the implemented need/resource submission lifecycle, not
campaign approval itself. PostgreSQL owns the state machine; web and mobile use
the same function-backed API contract.

## Migrations and storage

Apply these migrations in order:

| Migration | Implemented change |
| --- | --- |
| [165](../database/migrations/165_campaign_submission_status.sql) | Adds `superseded` to `campaign_need_status`. The enum addition must commit before migration 166 uses it. |
| [166](../database/migrations/166_campaign_listing_submissions.sql) | Adds submission identity, timing, private rejection feedback, current-slot constraints, event history, function-only writes, guarded decisions, notifications, and updated existing airdrop functions. |
| [167](../database/migrations/167_campaign_submission_query_indexes.sql) | Indexes `is_current` on both relationship tables so PostGraphile exposes equality conditions for current-submission queries. |
| [168](../database/migrations/168_campaign_listing_matching.sql) | Excludes historical participation from current campaign-based notification matching and indexes the history actor foreign key. |
| [169](../database/migrations/169_campaign_submission_typed_helpers.sql) | Uses explicitly typed scalar/JSON results in dynamic lifecycle helpers, preserving the same locking and transition rules. |

`app_public.campaign_need` stores one row per `(campaign_id, need_id)` pair;
`app_public.campaign_resource` stores one per `(campaign_id, resource_id)` pair.
These are mutable relationship rows, **not one row per submission attempt**.
Each new attempt receives a fresh `submission_id` and `submitted_at`, including
when an existing pair is reused. A decision keeps that attempt's identity.
Reapplying clears the relationship row's previous rejection note and decision
fields.

`is_current` identifies the listing's occupied slot. Partial unique indexes allow
at most one current relationship per need or resource across campaigns, and a
current row must be `pending` or `accepted`. Historical rows for other campaigns
remain present.

`app_public.campaign_listing_submission_event` is the append-only application
history: triggers append an event on insertion or a change to `submission_id` or
`status`. Events retain the attempt identity, status, submission/decision times,
actor, and rejection feedback. They are not snapshots of listing content.
Application callers cannot rewrite this history; it is not an immutable backup
against database administration or parent-row deletion (foreign keys cascade).

Migration 166 normalizes existing development data deterministically, retaining
at most one ongoing accepted relationship (otherwise the newest pending one)
per listing and marking conflicting rows `superseded`. It does not reconstruct
historical attempts or promise historical-data compatibility.

## Eligibility and ownership

- Only the listing creator can submit their need or resource.
- The destination campaign must be approved, already started, and not ended:
  `moderation_status = 'approved'` and `start_at <= now < end_at`.
  Future approved campaigns are not eligible yet.
- A new submission or replacement requires an active, unexpired listing.
- Only the campaign creator can accept or reject a current pending submission;
  the campaign must still satisfy the same approved/started/not-ended checks.
- All application writes go through the SQL functions, including writes by
  administrative accounts. Direct relationship-table mutation is revoked;
  administrative role membership does not bypass creator checks.

The canonical state machine is in
[database/functions/campaign/listing_submissions.sql](../database/functions/campaign/listing_submissions.sql).
Migration 166 includes its deployment copy.

## State transitions and the 24-hour protection period

| Current relationship | Allowed behavior |
| --- | --- |
| No occupied ongoing slot | Submit to an eligible campaign, creating a current `pending` attempt. |
| `pending`, less than 24 hours since `submitted_at` | Campaign creator may decide; listing owner cannot replace it with another campaign. |
| `pending`, at least 24 hours since `submitted_at` | Owner may explicitly replace it with another eligible campaign. The previous attempt becomes non-current `superseded`; the destination gets a fresh current `pending` attempt. |
| `accepted`, campaign not ended | Slot remains occupied until campaign end. No leave, replacement, or reversal to rejection is offered. |
| `rejected` | Slot is released immediately. Owner may explicitly resubmit to the same eligible campaign or submit to another eligible campaign. |
| `superseded` | Historical, non-current attempt; submitting to that campaign again is a new attempt subject to the occupied-slot rules. |
| Campaign ended | It no longer blocks submission to another eligible campaign. The submit function clears the ended relationship's current marker while retaining its status, including `accepted`. |

**24 hours is protection, not an expiry.** There is no automatic timeout,
automatic rejection, background slot release, or automatic move to another
campaign. A pending attempt remains pending and reviewable after 24 hours until
an explicit action changes it, provided its campaign is still eligible. At
exactly `submitted_at + 24 hours`, replacement is allowed.

Replacement is atomic: the old slot is superseded and the new submission is
created within the same operation. Failure leaves the previous relationship
unchanged. Submission and review serialize on the listing row, and SQL reads
wall-clock time after acquiring that lock, avoiding stale transaction times at
the 24-hour and campaign-end boundaries.

Retrying submission to the **same current campaign** is idempotent: it returns
the existing relationship without changing `submission_id`, resetting the
24-hour clock, or undoing an acceptance. In contrast, explicit resubmission
after rejection creates a new attempt with a **new 24-hour protection period**.
Rejection does not require the owner to wait 24 hours before resubmitting.

An accepted listing continues occupying its campaign slot even if the listing
is subsequently deactivated or expires. Neither action permits leaving or
joining another campaign before that campaign ends. Retaining accepted history
also preserves its use by the existing airdrop issuer after campaign end.

## Rejection feedback, edits, and stale review

Rejection feedback is optional, trimmed, and limited to **2,000 characters**;
blank feedback is stored as null. Relationship and event reads are scoped to
the campaign creator and listing creator, including for administrative
application roles: feedback is private, not public listing content.

The event trigger notifies the campaign creator of pending submissions and the
listing owner of acceptance or rejection. Rejection feedback is included in the
owner's decision notification. A superseded attempt is recorded in history
without a pending/accepted/rejected notification.

Editing a listing does not submit or resubmit it, reset its protection period,
create a frozen content snapshot, or trigger reapproval. Review concerns the
live listing, not an archived version of its fields. Rejected listings require
an explicit submit action even after the owner edits them; accepted listings do
not become pending again on edit.

`acceptCampaignNeed`, `rejectCampaignNeed`, `acceptCampaignResource`, and
`rejectCampaignResource` require the observed `expectedSubmissionId`. A decision
is valid only if that identifier still matches a current `pending` attempt.
Missing, replaced, resubmitted, or already-decided attempts fail with
`This application is no longer available for review`. Clients must refresh
stale review state rather than silently act on a newer attempt.

## Existing airdrop worker

There is **no new worker or pending-expiry job**. The existing scheduled worker
continues calling the updated
[payout issuer](../database/functions/token/issue_campaign_airdrop_payouts.sql)
and
[coming-soon notifier](../database/functions/token/issue_campaign_airdrop_coming_soon.sql).

- Payouts consider approved campaigns once `airdrop_at <= worker time`.
- Only `accepted` relationships with **`acted_at <= airdrop_at`** count. Acceptance
  at the exact cutoff qualifies; acceptance after it does not, even if the worker
  runs late. Submission before the cutoff alone is insufficient.
- Eligibility requires at least **two distinct items per account per campaign**:
  distinct needs plus distinct resources owned by that account, in any mix.
  Submission events and repeated attempts do not multiply the item count.
- Payout counting does not require `is_current`, an active listing, or an
  unexpired listing. Accepted historical relationships remain eligible under
  the cutoff rule.
- The existing token-movement idempotency key
  `campaign:<campaign_id>:airdrop:<account_id>` identifies the one-time payout
  per campaign/account. Reruns skip already-paid pairs; another attempt does
  not create another reward.
- Coming-soon notifications count current `pending`/`accepted` relationships,
  require at least one linked item, and retain the existing 48-hour upcoming
  airdrop window and per-account/campaign notification deduplication. A reminder
  is not a guarantee of payout eligibility.

## Deployment and compatibility

Deploy **database, backend, web, and mobile in lockstep** as a coordinated
breaking-contract release. Apply migrations 165–169 in order, refresh
the backend's generated GraphQL surface, and release matching web/mobile
operations and generated artifacts. Prevent old clients from using the changed
API during the rollout; do not treat mixed versions as supported.

There is **no backward-compatibility layer**: migration 166 removes the old
two-argument accept/reject functions and `unlink_campaign_resource` rather than
retaining compatibility overloads. Old clients without `expectedSubmissionId`
or relying on unlink behavior are unsupported, including installed mobile
builds. Coordinate mobile availability/access with the cutover rather than
assuming an old installation can continue to operate.

## Verification

Backend lifecycle suites exercise both listing kinds, ownership/private
feedback, 24-hour and campaign-end boundaries, atomic replacement failure,
accepted inactive/expired slot retention, initial need creation, explicit
same-campaign resubmission, parent-row locking across database sessions, and
airdrop cutoff/distinct-item/idempotency behavior. Web/mobile tests cover
moderation, rejection feedback, explicit resubmission, switching restrictions,
notification routing, and loading older/inactive listings directly by ID.

Schema generation validates both clients against the migrated API. Run the
read-only authorization boundary verifier after deployment. The optional
PL/pgSQL quality check requires the server-side `plpgsql_check` extension.