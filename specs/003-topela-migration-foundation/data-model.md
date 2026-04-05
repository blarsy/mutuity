# Data Model: Unified Tope-là + Mutuity Glossary

## Goal

Define the initial shared vocabulary for the unified platform without over-collapsing distinct concepts too early.

## Core entities

### `account`
A human user identity that can authenticate, own listings, send messages, and receive notifications.

**Notes**:
- May represent an individual, but can also act on behalf of an organization where allowed.
- Should map legacy auth providers and session models into one consistent target model.

### `organization`
An association, collective, or other group profile that can publish listings, participate in campaigns, and present public identity information.

### `resource`
An offer of something available to others.

Examples:
- donated object
- lent object
- exchangeable item
- available competence or service

### `need`
A request for help, an object, a service, or another form of support.

### `interest_response`
A proposed umbrella concept for expressions of intent around a listing.

**Initial MVP mapping**:
- `claim` remains the concrete response to a `need`
- `bid` or equivalent remains the concrete response to a `resource`

This concept is useful for future unification, but should stay mostly internal to the roadmap at first.

### `conversation`
A private discussion thread attached to a specific need/claim or resource/bid context.

### `message`
A single entry within a conversation, potentially including text, metadata, timestamps, and optional media references.

### `notification`
A persisted user-facing event such as new message, new claim/bid, settlement, approval, expiration, or campaign update.

### `campaign`
A time-bound coordination or incentive context that groups listings, actions, or rewards under shared rules.

### `media_asset`
A reusable representation of uploaded image/media metadata and ownership references.

### `location`
Coordinates and human-readable location metadata used for ranking, filtering, and map display.

## Initial boundary decisions

### Keep distinct in MVP v1
- `resource`
- `need`
- `claim`
- `bid`

### Share across both sides early
- `account`
- `organization`
- `conversation`
- `message`
- `notification`
- `media_asset`
- `location`
- auth/session model

## Open questions for later phases

1. Should `resource` and `need` eventually become one generalized `listing` table with a `listing_type` enum? => No, they have many fields, and even some state transition in common, but have different usage and lifecycles
2. Should `claim` and `bid` converge into one response table, or stay separate with shared helpers? => They stay separate with shared helpers
3. Which campaign mechanics are core to the unified MVP, and which remain backoffice-only? => Campaigns will be a modified version of what they are in Tope-là, to allow both needs and resources belonging to the theme of the campaign to make the account eligible for the airdrop. Also, unlike in Tope-là, but well in Mutuity, the unified campaign entity will be creatable by any account
4. Which admin-specific capabilities deserve first-class specs after the user-facing slices are rebuilt? => campaign approval/rejection is core