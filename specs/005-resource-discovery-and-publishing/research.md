# Research Notes: Resource Discovery And Publishing

## Key decisions

### 1. Keep `resource` and `need` distinct in the first merged MVP
- **Decision**: Resources remain their own first-class domain object instead of being collapsed into `need` or a generalized listing table too early.
- **Why**: Resources represent offers rather than requests, and their response/settlement behavior differs in meaningful ways from the needs/claims flow.

### 2. Keep `bid` distinct from `claim`
- **Decision**: Resource responses remain `bid`-style objects rather than being merged directly with need `claim`s.
- **Why**: The lifecycle and business terms differ, especially around default Topes amount negotiation, acceptance semantics, and related UI language.

### 3. Preserve Tope-là’s offer flexibility through independent modality flags
- **Decision**: The six resource flags (`isProduct`, `isService`, `canBeGiven`, `canBeExchanged`, `canBeTakenAway`, `canBeDelivered`) remain independent booleans with tri-state browse filtering.
- **Why**: Tope-là supports flexible resource combinations such as gifts that can also be exchanged, services combined with objects, and pickup plus delivery.

### 4. Use non-commercial wording for the legacy `price` field
- **Decision**: The field may remain in the data model as a legacy/internal concept, but user-facing UI must avoid the label `price`.
- **Why**: The intended meaning is a negotiated Topes reference amount or suggested starting point, not a fixed commercial sale price.

### 5. Align `resource.intensity` with the needs intensity model
- **Decision**: The rebuilt platform introduces a mandatory `intensity` field on resources using the same four levels and Topes ranges already established for needs.
- **Why**: This gives the merged product a shared appreciation model while still allowing resources and needs to remain distinct entities.

### 6. Improve discovery ordering versus current Tope-là behavior
- **Decision**: Resource browsing in the new platform should sort solely by geographical closeness, with most-recently-created as a deterministic tie-breaker.
- **Why**: The legacy app appears to rely more on recency; the merged product intentionally prefers practical nearby discovery.

## Audit evidence from Tope-là

- Resource fields and publish flow exist in the legacy product and include the expected modality flags, optional Topes amount, expiration, media, categories, and location.
- The legacy product already supports pickup/delivery and gift/exchange combinations, validating the choice to model the six flags explicitly.
- The legacy product treats a missing expiration as effectively permanent.
- Bid creation uses the resource’s optional token amount as a default starting point rather than a hard, immutable value.
- The new spec intentionally improves some behaviors, especially sorting and explicit expiration enforcement.

## Reuse candidates

- category and location browsing patterns
- image/media upload flow structure
- resource card and detail layout ideas
- bid creation UX patterns and notification timing

## Rewrite candidates

- any UI label or copy that frames the Topes amount as a fixed commercial `price`
- weakly enforced expiration behavior
- recency-only default sorting
- any legacy schema assumptions that do not fit the shared intensity model or the new SQL-owned validation rules