# Phase 1: Data Model

**Feature**: Mutuity Mobile Rewrite  
**Date**: 2026-07-03

## Overview

The data model for the mobile app is **not new**; it is shared with the Mutuity web backend via GraphQL. Mobile serves as a thin client consuming existing GraphQL types and mutations. This document outlines the key entities and relationships visible to mobile users.

---

## Core Entities

### 1. Account

Represents a signed-in user or organization.

**Attributes**:
- `id` (UUID, PK)
- `externalSubject` (string, unique, OAuth identifier)
- `displayName` (string, nullable)
- `bio` (string, nullable)
- `avatar` (string, URL to image)
- `location` (string, nullable)
- `profile_links` (JSONB, social links)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
- Owns Resources
- Owns Needs
- Owns Campaigns
- Sends Bids
- Sends/Receives Chat messages
- Owns Token movements (ledger)
- Receives Notifications

**Visibility**: Private to authenticated user; public profile visible to other users for trust building.

---

### 2. Resource

A product, service, or skill offered by an account.

**Attributes**:
- `id` (UUID, PK)
- `creator_account_id` (UUID, FK Account)
- `title` (string)
- `description` (string)
- `location` (string)
- `latitude`, `longitude` (numeric, for geo-search)
- `default_token_amount` (integer)
- `is_product`, `is_service` (boolean flags)
- `can_be_given`, `can_be_exchanged`, `can_be_taken_away`, `can_be_delivered` (boolean modifiers)
- `image_urls` (string array)
- `category_labels` (string array)
- `expires_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

**Relationships**:
- Belongs to Account (creator)
- Linked to Campaigns via CampaignResource
- Targeted by Bids

**Visibility**: Creator can manage; other authenticated users can view and bid.

**Mobile Relevance**: Core P1 feature (parity with Tope-là 1.0).

---

### 3. Need

**NEW** to Mutuity: A request for help, goods, or services.

**Attributes**:
- `id` (UUID, PK)
- `creator_account_id` (UUID, FK Account)
- `title` (string)
- `description` (string)
- `location` (string)
- `latitude`, `longitude` (numeric, for geo-search)
- `intensity` (enum: LOW, MEDIUM, HIGH)
- `proposed_token_amount` (integer, nullable)
- `required_competence_text`, `required_tooling_text` (string, nullable)
- `multiple_people_required` (boolean)
- `required_people_count` (integer, nullable)
- `image_urls` (string array)
- `expires_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

**Relationships**:
- Belongs to Account (creator)
- Linked to Campaigns via CampaignNeed
- Has 0..1 NeedClaim (only one claim per need)

**Visibility**: Creator can manage; other authenticated users can view and claim.

**Lifecycle**:
- `CREATED` → user posts the need
- `OPEN` → awaiting claims
- `CLAIMED` → one user committed; other claims blocked
- `FULFILLED` → need satisfied
- `EXPIRED` → past expires_at

**Mobile Relevance**: Core P2 feature (new Mutuity capability).

---

### 4. NeedClaim

**NEW** to Mutuity: A commitment by one account to fulfill a specific need.

**Attributes**:
- `id` (UUID, PK)
- `need_id` (UUID, FK Need)
- `account_id` (UUID, FK Account)
- `claimed_at` (timestamp)
- `fulfilled_at` (timestamp, nullable)
- `rejected_at` (timestamp, nullable)

**Relationships**:
- Belongs to Need
- Belongs to Account (claimer)

**Visibility**: Creator and claimer can see; other users cannot.

**Lifecycle**:
- `CLAIMED` → account committed
- `FULFILLED` → need satisfied
- `REJECTED` → claim withdrawn

**Mobile Relevance**: Core P2 feature.

---

### 5. Campaign

**NEW to mobile**: A structured program for collective resource-sharing and need-fulfillment.

**Attributes**:
- `id` (UUID, PK)
- `creator_account_id` (UUID, FK Account)
- `title` (string)
- `description` (string)
- `theme` (string, rich HTML)
- `image_url` (string, nullable)
- `moderation_status` (enum: PENDING, APPROVED, REJECTED)
- `manager_note_from_creator` (string, nullable)
- `rewards_multiplier` (integer, 5–10)
- `airdrop_amount` (integer)
- `start_at`, `airdrop_at`, `end_at` (timestamps)
- `created_at`, `updated_at` (timestamps)

**Relationships**:
- Created by Account
- Contains CampaignNeeds
- Contains CampaignResources
- Has 0..n CampaignModerationNotes

**Visibility**: 
- `PENDING` → creator and admins only
- `APPROVED` → all authenticated users
- `REJECTED` → creator and admins only

**Lifecycle**:
- `PENDING` → waiting admin validation (cannot be active)
- `APPROVED` → active during [start_at, end_at]
- `REJECTED` → archived

**Mobile Relevance**: Core P3 feature (new Mutuity capability).

---

### 6. CampaignNeed

Association between a Campaign and a Need, with moderation status.

**Attributes**:
- `campaign_id` (UUID, PK, FK Campaign)
- `need_id` (UUID, PK, FK Need)
- `status` (enum: PENDING, ACCEPTED, REJECTED)
- `created_at` (timestamp)
- `acted_at` (timestamp, nullable)
- `acted_by_account_id` (UUID, nullable)

**Visibility**: Associated need and campaign visible; moderation actions visible to creator and admins.

**Lifecycle**:
- `PENDING` → need submitted to campaign (awaiting creator moderation)
- `ACCEPTED` → campaign creator approved
- `REJECTED` → campaign creator rejected

**Mobile Relevance**: Campaign moderation workflow (P3).

---

### 7. CampaignResource

Association between a Campaign and a Resource, with moderation status.

**Attributes**:
- `campaign_id` (UUID, PK, FK Campaign)
- `resource_id` (UUID, PK, FK Resource)
- `status` (enum: PENDING, ACCEPTED, REJECTED)
- `created_at` (timestamp)
- `acted_at` (timestamp, nullable)
- `acted_by_account_id` (UUID, nullable)

**Visibility**: Associated resource and campaign visible; moderation actions visible to creator and admins.

**Lifecycle**: Same as CampaignNeed (PENDING → ACCEPTED/REJECTED).

**Mobile Relevance**: Campaign moderation workflow (P3).

---

### 8. Bid

Existing Tope-là feature: An offer or counter-offer for a resource.

**Attributes**:
- `id` (UUID, PK)
- `resource_id` (UUID, FK Resource)
- `sent_by_account_id` (UUID, FK Account)
- `status` (enum: OPEN, ACCEPTED, REJECTED, CANCELLED)
- `amount` (integer, tokens)
- `created_at`, `updated_at` (timestamps)

**Visibility**: Bidder and resource creator; other users cannot see.

**Mobile Relevance**: Parity feature (P1).

---

### 9. Chat / Message

Existing Tope-là feature: 1:1 conversations between users.

**Attributes**:
- `id` (UUID, PK)
- `sender_account_id` (UUID, FK Account)
- `recipient_account_id` (UUID, FK Account)
- `body` (string)
- `created_at` (timestamp)
- `read_at` (timestamp, nullable)

**Relationships**:
- Sender/Recipient are Accounts
- Optionally tied to a Resource (context)

**Visibility**: Participants only.

**Mobile Relevance**: Parity feature (P1).

---

### 10. Notification

Activity feed for an account.

**Attributes**:
- `id` (UUID, PK)
- `account_id` (UUID, FK Account)
- `type` (enum: RESOURCE_CREATED, BID_SENT, BID_ACCEPTED, NEED_CREATED, NEED_CLAIMED, CAMPAIGN_CREATED, CAMPAIGN_APPROVED, TOKEN_RECEIVED, etc.)
- `body` (string)
- `related_account_id` (UUID, nullable)
- `created_at` (timestamp)
- `read_at` (timestamp, nullable)

**Visibility**: Account owner only.

**Mobile Relevance**: Parity feature (P1).

---

### 11. TokenMovement

Ledger entry for token balance tracking.

**Attributes**:
- `id` (UUID, PK)
- `account_id` (UUID, FK Account)
- `type` (enum: INITIAL_GRANT, AIRDROP, BID_SETTLED, CONTRIBUTION, TOKEN_GIFT, etc.)
- `amount` (integer)
- `created_at` (timestamp)
- `related_campaign_id` (UUID, nullable)

**Relationships**:
- Belongs to Account

**Visibility**: Account owner; public balance visible for trust building.

**Mobile Relevance**: Parity feature (token display) (P1).

---

## Key Entity Relationships (ER Diagram)

```
Account
├─ owns Resources
├─ owns Needs
├─ owns Campaigns
├─ sends Bids
├─ sends/receives Chat messages
├─ receives Notifications
└─ has TokenMovement ledger

Resource
├─ created by Account
├─ linked to Campaigns (via CampaignResource)
└─ targets Bids

Need
├─ created by Account
├─ linked to Campaigns (via CampaignNeed)
└─ has 0..1 NeedClaim

Campaign
├─ created by Account
├─ contains CampaignNeeds
└─ contains CampaignResources
```

---

## Data Consistency Rules

1. **Campaign Validation Gate**: A campaign cannot be active (start_at ≤ now ≤ end_at) unless moderation_status = APPROVED.
2. **Need Exclusivity**: Only one NeedClaim per Need; once claimed, other accounts cannot claim.
3. **Resource Expiry**: Expired resources are read-only; cannot be bid on or added to new campaigns.
4. **Role-Based Visibility**: Admin-only fields (e.g., moderation notes) are not visible to regular users via GraphQL.

---

## Summary of Mobile-Visible Schema

| Entity | Mobile P1 | Mobile P2 | Mobile P3 | Notes |
|--------|----------|----------|----------|-------|
| Account | ✓ | ✓ | ✓ | Parity + new campaign creator role |
| Resource | ✓ | – | ✓ | Parity + campaign membership |
| Need | – | ✓ | ✓ | NEW: Mutuity core feature |
| NeedClaim | – | ✓ | ✓ | NEW: Mutuity core feature |
| Campaign | – | – | ✓ | NEW: Mutuity core feature |
| CampaignNeed | – | – | ✓ | NEW: Campaign moderation |
| CampaignResource | – | – | ✓ | NEW: Campaign moderation |
| Bid | ✓ | – | – | Parity feature |
| Chat | ✓ | – | – | Parity feature |
| Notification | ✓ | ✓ | ✓ | Parity + new event types |
| TokenMovement | ✓ | – | – | Parity feature |

---

## Next Steps

Proceed to contracts/ directory for GraphQL operations, navigation structure, and state management patterns.
