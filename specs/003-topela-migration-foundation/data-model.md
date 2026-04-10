# Data Model: Unified Tope-là + Mutuity Glossary

## Goal

Define the initial shared vocabulary for the unified platform without over-collapsing distinct concepts too early.

## Core entities

### `account`
A human user identity that can authenticate, own listings, send messages, and receive notifications.

**Notes**:
- May represent an individual, but can also act on behalf of an organization where allowed.
- Should map legacy auth providers and session models into one consistent target model.
- May also store zero or more typed profile links, each with a URL, a caption, and a type such as `facebook`, `instagram`, `x`, or `website`.

### `organization`
An association, collective, or other group profile that can publish listings, participate in campaigns, and present public identity information.

### `resource`
An offer of something available to others.

Examples:
- donated object
- lent object
- exchangeable item
- available competence or service

**Shared appreciation semantics**:
- `intensity` is mandatory on a resource, just as it is on a need.
- It uses the same four discrete values and Topes ranges already defined for needs: `leg up` (10 to 99), `sharing` (100 to 999), `commitment` (1000 to 4999), and `rare contribution` (5000 or more).
- A resource may also carry an optional legacy/internal `price` field, but in the rebuilt product this should be presented as a negotiated Topes reference amount rather than a fixed commercial price.
- When this optional amount is set, it serves as the default Topes amount proposed in a bid, and its numeric value must match the selected `intensity` range.
- A resource may also include an optional rich-text `description` field, intended for the resource detail UI, with a maximum length of 8000 characters and safe rendering/sanitization requirements.

**Modality flags**:
- `isProduct`: the resource is a physical object such as a tool, food item, book, or clothing.
- `isService`: the resource is a competence, skill, or service.
- `canBeGiven`: the resource can be given free of charge.
- `canBeExchanged`: the resource can be exchanged for another resource, a number of Topes, or any other terms agreed by the two participants in the conversation.
- `canBeTakenAway`: the interested account can pick up or take away the resource.
- `canBeDelivered`: the resource creator can deliver the resource.

**Important rule**:
- All of these flags are independent booleans.
- No flag prevents any other flag from being set.
- Valid combinations include, for example, a resource that can both be given and exchanged, or a resource that is both a product and a service if the product and service are offered together.

**Browse-filter semantics**:
- Each flag also supports a tri-state browse filter: `neutral`, `yes`, or `no`.
- `neutral` means the query does not restrict on that flag and returns resources whether the stored value is `true` or `false`.
- `yes` means only resources with that flag set to `true` are returned.
- `no` means only resources with that flag set to `false` are returned.

**Expiration semantics**:
- A resource may optionally have an expiration datetime.
- If an expiration datetime is present, the resource becomes expired at that moment and should no longer appear in active browsing queries.
- If no expiration datetime is present, the resource is considered permanent until it is withdrawn, closed, or otherwise deactivated.

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