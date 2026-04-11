# Implementation Plan: Chat And Conversations

**Branch**: `006-chat-and-conversations` | **Date**: 2026-04-11 | **Spec**: `/specs/006-chat-and-conversations/spec.md`  
**Input**: Feature specification from `/specs/006-chat-and-conversations/spec.md`

## Summary

Replace the placeholder `Chat` page with a real Tope-là-style conversation workspace that mixes need-bound and resource-bound threads, supports search, presents a unified live messenger for both contexts, and adds the missing read-receipt, typing-indicator, inbox-notification, and snackbar-alert behaviors.

The implementation should reuse the existing need-side conversation foundation already present in the unified app (`claim_conversation`, `claim_message`, `ClaimConversationPanel`) while extending the same experience into a first-class top-level chat workspace and the resource side of the product.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, PostgreSQL 16  
**Storage**: PostgreSQL 16  
**Testing**: Jest/Vitest frontend tests, backend integration and contract tests  
**Target Platform**: Web first, mobile-friendly responsive layout  
**Project Type**: Monorepo feature slice building on the existing `frontend/`, `backend/`, and `database/` structure  
**Constraints**: Keep PostgreSQL as the source of truth for permissions, read state, and notifications; preserve the repository’s SQL-first rule for business logic; reuse existing claim-conversation primitives where possible instead of duplicating divergent chat models  
**Scale/Scope**: MVP two-party messaging for needs and resources, with read receipts, typing indicators, and global alerts

## Constitution Check

- Pass: Conversation membership, message visibility, unread/read state, and message notifications remain enforced in PostgreSQL and not delegated to the browser.
- Pass: The current need-side conversation model and tests can be reused rather than rewritten from scratch.
- Pass: The new `/chat` surface is a real end-to-end product slice, not just a placeholder replacement.
- Pass: Real-time feedback such as typing indicators or snackbar triggers may use a lightweight delivery layer, but persisted chat state and permission checks remain SQL-owned.

## Current Baseline And Migration Notes

The existing codebase already includes:

- a placeholder `frontend/src/pages/chat.tsx`
- need-side conversation persistence in `database/migrations/008_need_search_and_claims.sql`
- message send/read helpers in `database/functions/claim/send_claim_message.sql` and `mark_claim_messages_read.sql`
- a working need thread UI in `frontend/src/features/needs/ClaimConversationPanel.tsx`

The current Tope-là implementation audited in `symmetrical-broccoli` adds:

- a unified, chat-oriented conversation list UI
- a live messenger layout with a shared header, message list, and composer
- mark-as-read on open and unread indicators in the list

This feature extends that baseline with the new product decisions now confirmed for the unified app:

- top-level mixed list of both resource and need conversations
- search by participant name, context title, and message contents
- text-required messages with up to 5 images
- visual seen marker for the last viewed message
- typing indicator with a 3–5 second activity timeout
- inbox notifications plus a bottom-left clickable snackbar for new incoming messages

## Delivery Slices

### Slice 1 — Unified conversation list workspace (P1)
- build the top-level `/chat` page
- aggregate need-bound and resource-bound conversations into one normalized list
- order by `lastActivityAt` descending
- add context discriminator icons and unread indicators
- add a chat search box matching participant names, titles, and message text

### Slice 2 — Shared live messenger for both contexts (P1)
- define a normalized conversation-thread view model for either `need` or `resource`
- render a common messenger layout with only the header differing by context data
- allow navigation to the other participant and the bound listing details page
- support mandatory text plus up to 5 attached images per message
- preserve long-lived follow-up access after the initial bid/claim lifecycle changes

### Slice 3 — Read receipts and typing awareness (P2)
- mark inbound messages read when the destination account opens the conversation and reaches the bottom of the thread
- show a seen marker on the sender’s latest outbound message when the recipient has viewed it
- add a short-lived typing signal model with a 3–5 second timeout
- surface the typing indicator at the bottom of the live messenger

### Slice 4 — Global chat notifications and snackbar alerts (P2)
- emit persistent notifications-inbox items for new incoming chat messages
- show a bottom-left, 5-second snackbar alert when the user is not already looking at that exact conversation
- make the snackbar clickable so it opens the relevant conversation directly
- suppress duplicate snackbar noise when the user is already inside that thread

## Data And Permission Model

### Conversation shape
- A conversation is always between exactly **two accounts**.
- There is at most **one conversation per account pair and per bound context** (`need` or `resource`).
- Need-side and resource-side persistence may remain physically distinct in the database at first, but the UI should consume a unified summary/thread read model.

### Message shape
- `text` is mandatory for every message.
- A message may carry **0 to 5** attached images.
- Message ordering is chronological ascending inside the thread and last-activity descending in the conversation list.
- Read/view state must be tracked per recipient-facing message delivery.

### Permissions
- Only conversation participants may list, open, search, send, or mark messages as read in that conversation.
- Search results must never reveal conversations or message text to non-participants.
- Existing conversations remain accessible to the same two participants for later follow-up even after bid/claim progression.

## Web IA And Componentization Plan

### Primary routes
- **`/chat`**: authenticated chat workspace with mixed conversation list, search, unread states, and an active thread panel or route state
- **linked account page**: navigated to from the conversation header via the other participant’s name/avatar
- **linked need/resource detail page**: navigated to from the conversation header via the bound context title/image

### Proposed frontend surfaces

| Surface | Responsibility |
|--------|----------------|
| `ChatWorkspacePage` | loads the mixed conversation summaries and active-thread shell |
| `ConversationListPanel` | search, unread state, latest-activity ordering, and need/resource discriminator visuals |
| `ConversationHeader` | normalized need/resource header with account and listing navigation |
| `ConversationThread` | message timeline, read marker, typing indicator, and bottom-aware read behavior |
| `MessageComposer` | mandatory text entry plus up to 5 image attachments |
| `ChatSnackbarBridge` | app-wide bottom-left clickable alerts for new incoming messages |

## Testing Strategy

### Backend
- verify unified conversation listing and search logic across both need and resource contexts
- verify message validation (`text required`, `<= 5 images`)
- verify participant-only access to conversation queries and mutations
- verify read receipt and typing signal persistence semantics
- verify notification and snackbar payload generation rules for incoming messages

### Frontend
- verify `/chat` replaces the placeholder page with a mixed list and search UX
- verify the live messenger behaves the same for need and resource threads apart from header data
- verify visual discriminator icons, seen markers, and typing indicator rendering
- verify snackbar appearance, suppression, and click-through navigation behavior

## Non-Goals For This Slice

- group chats or more than two participants
- audio/video calling
- message editing or deletion history
- end-to-end encryption changes beyond existing transport/session protections
- rich reactions beyond allowing standard emoji/emoticon characters in message text
