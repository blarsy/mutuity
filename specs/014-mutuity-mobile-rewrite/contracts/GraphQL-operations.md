# Contract: GraphQL Operations

**Feature**: Mutuity Mobile Rewrite  
**Date**: 2026-07-03

## Overview

The mobile app consumes GraphQL operations from the Mutuity backend. This contract lists the operations required for each feature area and their expected response shapes. All operations are already defined in the web frontend and will be codegen-generated for mobile.

---

## Authentication Operations

### LoginWithEmailPassword

**Operation**:
```graphql
mutation LoginWithEmailPassword($email: String!, $password: String!) {
  loginWithEmailPassword(input: { email: $email, password: $password }) {
    jwtToken
  }
}
```

**Response**:
```json
{
  "loginWithEmailPassword": {
    "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Usage**: Mobile stores token in SecureStore; Apollo Client adds as Authorization header.

---

### SignUp

**Operation**:
```graphql
mutation SignUp($email: String!, $password: String!, $displayName: String!) {
  signUp(input: { email: $email, password: $password, displayName: $displayName }) {
    jwtToken
  }
}
```

**Response**: Same as LoginWithEmailPassword.

---

### RefreshToken

**Operation**:
```graphql
mutation RefreshToken {
  refreshToken {
    jwtToken
  }
}
```

**Response**: New token; Apollo Client replaces old token automatically.

### GetSessionData

**Purpose**: Bootstrap the authenticated mobile session with account identity and operational preferences.

**Expected shape**:
- account identity/profile basics
- unread notifications and unread conversations counts or identifiers
- server-driven client log level when available
- notification preference data needed by the preferences surface

**Usage**: App launch, login completion, session restore.

---

## Operational Continuity Operations

### SyncPushToken

**Purpose**: Synchronize the mobile push token with the backend after login or token refresh.

**Usage**: Called after push permission/token retrieval succeeds.

### GetMinimumClientVersion

**Purpose**: Determine whether the installed build is still supported before normal app flow continues.

**Usage**: Startup version gate.

### CreateClientLog

**Purpose**: Send correlated client-side diagnostics or monitoring events to the backend when mobile monitoring is enabled.

**Usage**: GraphQL/network/client error reporting, startup diagnostics, support correlation.

### UpdateAccountBroadcastPrefs

**Purpose**: Persist notification delivery preferences such as immediate delivery versus periodic summaries.

**Usage**: Preferences screen.

### MessageReceived / NotificationReceived / AccountChange subscriptions

**Purpose**: Preserve realtime continuity for unread state, chat, and account refresh behavior.

**Usage**: Shared app session runtime after login.

---

## Resources Operations

### SearchResources

**Operation**:
```graphql
query SearchResources(
  $location: String
  $distance: Float
  $categoryLabels: [String]
  $orderBy: ResourcesOrderBy
  $first: Int
  $after: Cursor
) {
  allResources(
    filter: { location: $location, distance: $distance, categoryLabelIn: $categoryLabels }
    orderBy: $orderBy
    first: $first
    after: $after
  ) {
    nodes {
      id
      title
      description
      location
      defaultTokenAmount
      imageUrls
      categoryLabels
      creatorAccountId
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

**Purpose**: Discover resources by location, distance, category.  
**Usage**: Search screen, resource listing.

---

### CreateResource

**Operation**:
```graphql
mutation CreateResource($input: CreateResourceInput!) {
  createResource(input: $input) {
    resource {
      id
      title
      description
      location
      defaultTokenAmount
      imageUrls
      categoryLabels
      canBeGiven
      canBeExchanged
      canBeTakenAway
      canBeDelivered
      expiresAt
      createdAt
    }
  }
}
```

**Purpose**: Create a new resource.  
**Usage**: Resources screen, create resource flow.

---

### UpdateResource

**Operation**:
```graphql
mutation UpdateResource($id: UUID!, $input: ResourcePatch!) {
  updateResource(input: { id: $id, patch: $input }) {
    resource {
      id
      title
      description
      location
      defaultTokenAmount
      imageUrls
      categoryLabels
    }
  }
}
```

**Purpose**: Update an existing resource.  
**Usage**: Resource edit flow.

---

### DeleteResource

**Operation**:
```graphql
mutation DeleteResource($id: UUID!) {
  deleteResource(input: { id: $id }) {
    boolean
  }
}
```

**Purpose**: Delete a resource.  
**Usage**: Resource management screen.

---

## Needs Operations

### SearchNeeds

**Operation**:
```graphql
query SearchNeeds(
  $location: String
  $distance: Float
  $intensity: NeedIntensity
  $orderBy: NeedsOrderBy
  $first: Int
  $after: Cursor
) {
  allNeeds(
    filter: { location: $location, distance: $distance, intensity: $intensity }
    orderBy: $orderBy
    first: $first
    after: $after
  ) {
    nodes {
      id
      title
      description
      location
      intensity
      proposedTokenAmount
      expiresAt
      creatorAccountId
      accountByCreatorAccountId {
        id
        displayName
      }
      campaignNeedsByNeedId {
        nodes {
          campaignId
          status
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

**Purpose**: Search needs by location, intensity.  
**Usage**: Needs browsing screen.

---

### CreateNeed

**Operation**:
```graphql
mutation CreateNeed($input: CreateNeedInput!) {
  createNeed(input: $input) {
    need {
      id
      title
      description
      location
      intensity
      proposedTokenAmount
      expiresAt
      createdAt
    }
  }
}
```

**Purpose**: Create a new need.  
**Usage**: Create need flow.

---

### UpdateNeed

**Operation**:
```graphql
mutation UpdateNeed($id: UUID!, $input: NeedPatch!) {
  updateNeed(input: { id: $id, patch: $input }) {
    need {
      id
      title
      description
      location
      intensity
      proposedTokenAmount
      expiresAt
      updatedAt
    }
  }
}
```

**Purpose**: Update a need.  
**Usage**: Edit need flow.

---

### ClaimNeed

**Operation**:
```graphql
mutation ClaimNeed($needId: UUID!) {
  claimNeed(input: { needId: $needId }) {
    needClaim {
      id
      needId
      accountId
      claimedAt
    }
  }
}
```

**Purpose**: Claim a need (commit to fulfill it).  
**Usage**: Need detail screen, claim action.

---

## Campaigns Operations

### CreateCampaign

**Operation**:
```graphql
mutation CreateCampaign($input: CreateCampaignInput!) {
  createCampaign(input: $input) {
    campaign {
      id
      title
      description
      theme
      imageUrl
      moderationStatus
      rewardsMultiplier
      airdropAmount
      startAt
      airdropAt
      endAt
      createdAt
    }
  }
}
```

**Purpose**: Create a new campaign (enters PENDING validation state).  
**Usage**: Create campaign flow.

---

### GetCampaignById

**Operation**:
```graphql
query GetCampaignById($campaignId: UUID!) {
  campaignById(id: $campaignId) {
    id
    title
    description
    theme
    imageUrl
    moderationStatus
    startAt
    airdropAt
    endAt
    creatorAccountId
    accountByCreatorAccountId {
      id
      displayName
    }
    campaignNeedsByCampaignId {
      nodes {
        needId
        status
        actedAt
        needByNeedId {
          id
          title
          status
        }
      }
    }
    campaignResourcesByCampaignId {
      nodes {
        resourceId
        status
        actedAt
        resourceByResourceId {
          id
          title
          defaultTokenAmount
        }
      }
    }
  }
}
```

**Purpose**: Fetch full campaign detail including pending needs/resources.  
**Usage**: Campaign detail screen, moderation screen.

---

### MyCampaignsConnection

**Operation**:
```graphql
query MyCampaignsConnection(
  $creatorAccountId: UUID!
  $first: Int!
  $after: Cursor
) {
  allCampaigns(
    condition: { creatorAccountId: $creatorAccountId }
    orderBy: CREATED_AT_DESC
    first: $first
    after: $after
  ) {
    nodes {
      id
      title
      theme
      moderationStatus
      startAt
      airdropAt
      endAt
      createdAt
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Purpose**: List campaigns created by current user.  
**Usage**: Campaigns screen (my campaigns section).

---

### CreateCampaignNeed

**Operation**:
```graphql
mutation CreateCampaignNeed($input: CreateCampaignNeedInput!) {
  createCampaignNeed(input: $input) {
    campaignNeed {
      campaignId
      needId
      status
      createdAt
    }
  }
}
```

**Purpose**: Submit a need to a campaign (enters PENDING moderation).  
**Usage**: Add need to campaign flow.

---

### CreateCampaignResource

**Operation**:
```graphql
mutation CreateCampaignResource($input: CreateCampaignResourceInput!) {
  createCampaignResource(input: $input) {
    campaignResource {
      campaignId
      resourceId
      status
      createdAt
    }
  }
}
```

**Purpose**: Submit a resource to a campaign (enters PENDING moderation).  
**Usage**: Add resource to campaign flow.

---

### AcceptCampaignNeed (Creator Moderation)

**Operation**:
```graphql
mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!) {
  acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
    campaignNeed {
      campaignId
      needId
      status
      actedAt
      actedByAccountId
    }
  }
}
```

**Purpose**: Campaign creator approves a need into the campaign.  
**Usage**: Campaign moderation screen.

---

### RejectCampaignNeed (Creator Moderation)

**Operation**:
```graphql
mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!) {
  rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
    campaignNeed {
      campaignId
      needId
      status
      actedAt
    }
  }
}
```

**Purpose**: Campaign creator rejects a need.  
**Usage**: Campaign moderation screen.

---

## Bids Operations (Parity)

### SearchBidsForResource

**Operation**:
```graphql
query SearchBidsForResource($resourceId: UUID!) {
  allBids(condition: { resourceId: $resourceId }) {
    nodes {
      id
      resourceId
      sentByAccountId
      status
      amount
      createdAt
      accountBySentByAccountId {
        id
        displayName
      }
    }
  }
}
```

**Purpose**: Fetch bids on a resource.  
**Usage**: Resource detail screen (received bids view).

---

### SendBid

**Operation**:
```graphql
mutation SendBid($input: CreateBidInput!) {
  createBid(input: $input) {
    bid {
      id
      resourceId
      sentByAccountId
      status
      amount
      createdAt
    }
  }
}
```

**Purpose**: Send a bid/offer for a resource.  
**Usage**: Bid screen, send offer flow.

---

## Chat Operations (Parity)

### SearchConversations

**Operation**:
```graphql
query SearchConversations($accountId: UUID!, $first: Int, $after: Cursor) {
  allChatMessages(
    condition: { senderAccountId: $accountId }
    orderBy: CREATED_AT_DESC
    first: $first
    after: $after
  ) {
    nodes {
      id
      senderAccountId
      recipientAccountId
      body
      createdAt
      readAt
      accountByRecipientAccountId {
        id
        displayName
      }
    }
  }
}
```

**Purpose**: Fetch list of conversations.  
**Usage**: Chat screen.

---

### SendChatMessage

**Operation**:
```graphql
mutation SendChatMessage($input: CreateChatMessageInput!) {
  createChatMessage(input: $input) {
    chatMessage {
      id
      senderAccountId
      recipientAccountId
      body
      createdAt
    }
  }
}
```

**Purpose**: Send a message.  
**Usage**: Chat detail screen, send message action.

---

## Notifications Operations (Parity)

### GetNotifications

**Operation**:
```graphql
query GetNotifications(
  $accountId: UUID!
  $first: Int!
  $after: Cursor
) {
  allNotifications(
    condition: { accountId: $accountId }
    orderBy: CREATED_AT_DESC
    first: $first
    after: $after
  ) {
    nodes {
      id
      type
      body
      createdAt
      readAt
      relatedAccountId
      accountByRelatedAccountId {
        id
        displayName
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

**Purpose**: Fetch notification feed.  
**Usage**: Notifications screen.

---

### MarkNotificationRead

**Operation**:
```graphql
mutation MarkNotificationRead($notificationId: UUID!) {
  markNotificationRead(input: { notificationId: $notificationId }) {
    notification {
      id
      readAt
    }
  }
}
```

**Purpose**: Mark a notification as read.  
**Usage**: Notification tap action.

---

## Account Operations (Parity)

### GetCurrentAccount

**Operation**:
```graphql
query GetCurrentAccount {
  currentAccount {
    id
    displayName
    externalSubject
    bio
    avatar
    location
    profileLinks
    createdAt
    updatedAt
  }
}
```

**Purpose**: Fetch logged-in user's profile.  
**Usage**: Profile screen, app initialization.

---

### UpdateAccount

**Operation**:
```graphql
mutation UpdateAccount($input: AccountPatch!) {
  updateAccount(input: { patch: $input }) {
    account {
      id
      displayName
      bio
      avatar
      location
      profileLinks
      updatedAt
    }
  }
}
```

**Purpose**: Update profile information.  
**Usage**: Edit profile screen.

---

## Summary

**Total Operations**: ~30 queries and mutations.  
**Codegen Output**: All operations generate TypeScript types in `src/types/graphql.generated.ts`.  
**Source**: Operations are reused from web frontend; mobile adds only mobile-specific operations (e.g., campaign moderation flows).

---

## Usage Pattern (Apollo Client)

```typescript
import { useQuery } from '@apollo/client';
import { SEARCH_RESOURCES_QUERY } from '../services/graphql/queries';

export function SearchScreen() {
  const { data, loading, error, fetchMore } = useQuery(SEARCH_RESOURCES_QUERY, {
    variables: { location: 'Brussels', distance: 10 },
    fetchPolicy: 'cache-and-network'
  });

  // Use generated types:
  const resources: SearchResourcesQuery['allResources']['nodes'] = data?.allResources?.nodes ?? [];

  return (
    // Render resources
  );
}
```

---

## Next Steps

See `navigation-contract.md` for screen hierarchy and `state-management.md` for Apollo Client + offline patterns.
