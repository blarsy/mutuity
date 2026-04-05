# Data Model: Resource Discovery And Publishing

## Resource

A `resource` is an offer made available by an account or organization. It is distinct from a `need`, which expresses a request rather than an offer.

### Core fields
- `id`
- `creatorAccountId`
- `title`
- `description` *(optional, rich-text, max 8000 chars)*
- `categoryIds` *(one or more categories may apply)*
- `location` *(human-readable address plus coordinates when available)*
- `createdAt`
- `updatedAt`
- `expiresAt` *(optional; null means permanent)*
- `isActive`
- `status` *(draft / published / expired / withdrawn, if the implementation chooses an explicit enum rather than deriving part of this from timestamps and active flags)*

### Appreciation and negotiation fields
- `intensity` *(required; one of `leg up`, `sharing`, `commitment`, `rare contribution`)*
- `defaultTopesAmount` *(optional; legacy/internal `price` concept, but user-facing copy should avoid the word `price`)*

### Intensity mapping
- `leg up` → `10` to `99`
- `sharing` → `100` to `999`
- `commitment` → `1000` to `4999`
- `rare contribution` → `5000` or more

If `defaultTopesAmount` is set, it must fit the selected intensity range.

### Modality flags
All of the following are independent booleans:
- `isProduct`
- `isService`
- `canBeGiven`
- `canBeExchanged`
- `canBeTakenAway`
- `canBeDelivered`

No flag disables any other flag. A resource may be, for example, both giveable and exchangeable, or both a product and a service.

### Browse-filter semantics
Each modality flag supports a tri-state filter:
- `neutral` → do not constrain on that flag
- `yes` → require the flag to be `true`
- `no` → require the flag to be `false`

### Expiration behavior
- If `expiresAt` is set and the current time reaches or passes it, the resource becomes expired.
- Expired resources disappear from browsing results.
- Expired resources also reject any new bids.
- If `expiresAt` is null, the resource is considered permanent until withdrawn or otherwise deactivated.

## ResourceBid

A `resourceBid` is a response made by an interested account on a resource.

### Core fields
- `id`
- `resourceId`
- `bidderAccountId`
- `createdAt`
- `status` *(open / accepted / declined / withdrawn / expired or equivalent implementation states)*
- `message` *(optional opening message)*
- `proposedTopesAmount` *(optional; defaults from the resource’s reference amount when available, but remains negotiable)*
- `validUntil` *(optional, depending on the chosen bid-expiration policy)*

### Rules
- only authenticated users can create a bid
- the resource creator cannot bid on their own resource
- no one can bid on an expired, withdrawn, or inactive resource
- `bid` remains distinct from `claim`, even if messaging and notifications are shared at the infrastructure level

## ResourceQueryRequest

The resource browse query includes:
- reference location
- optional text search
- optional category filters
- six tri-state modality filters
- any future visibility/campaign constraints

## Sorting rule
Default sorting is:
1. closest geographical distance first
2. for equal distance, most recently created first