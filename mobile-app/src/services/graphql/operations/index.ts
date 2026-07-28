import { gql } from "@apollo/client";

export const ACCOUNT_BY_ID_QUERY = gql`
  query AccountById($id: UUID!) {
    accountById(id: $id) {
      id
      displayName
      avatarUrl
      location
      preferredLanguage
    }
  }
`;

export const SEARCH_RESOURCES_QUERY = gql`
  query SearchResources(
    $first: Int
    $after: Cursor
    $searchText: String
    $favorLocalResources: Boolean
    $maxDistanceKm: BigFloat
    $isProduct: TriStateFilter
    $isService: TriStateFilter
    $canBeTakenAway: TriStateFilter
    $canBeDelivered: TriStateFilter
    $canBeExchanged: TriStateFilter
    $canBeGiven: TriStateFilter
  ) {
    searchResources(
      first: $first
      after: $after
      searchText: $searchText
      favorLocalResources: $favorLocalResources
      maxDistanceKm: $maxDistanceKm
      isProduct: $isProduct
      isService: $isService
      canBeTakenAway: $canBeTakenAway
      canBeDelivered: $canBeDelivered
      canBeExchanged: $canBeExchanged
      canBeGiven: $canBeGiven
    ) {
      nodes {
        id
        title
        description
        createdAt
        creatorAccountId
        creatorDisplayName
        distanceKm
        latitude
        longitude
        isProduct
        isService
        canBeTakenAway
        canBeDelivered
        canBeExchanged
        canBeGiven
        defaultTokenAmount
        categoryLabels
        imageUrls
      }
    }
  }
`;

export const MY_RESOURCES_QUERY = gql`
  query MyResources($creatorAccountId: UUID!, $first: Int, $after: Cursor) {
    allResources(
      condition: { creatorAccountId: $creatorAccountId, isActive: true }
      orderBy: ID_DESC
      first: $first
      after: $after
    ) {
      nodes {
        id
        title
        description
        defaultTokenAmount
        imageUrls
        isActive
        isProduct
        isService
        canBeTakenAway
        canBeDelivered
        canBeExchanged
        canBeGiven
        location
        latitude
        longitude
        expiresAt
        updatedAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const SEARCH_NEEDS_QUERY = gql`
  query SearchNeeds($first: Int, $after: Cursor) {
    allNeeds(first: $first, after: $after) {
      nodes {
        id
        creatorAccountId
        title
        description
        createdAt
        proposedTopesAmount
        intensity
        needClaimsByNeedId(first: 20, orderBy: PRIMARY_KEY_DESC) {
          nodes {
            id
            claimerAccountId
            status
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const MY_NEEDS_QUERY = gql`
  query MyNeeds($creatorAccountId: UUID!, $first: Int, $after: Cursor) {
    allNeeds(condition: { creatorAccountId: $creatorAccountId }, first: $first, after: $after) {
      nodes {
        id
        creatorAccountId
        title
        description
        imageUrls
        location
        latitude
        longitude
        createdAt
        expiresAt
        proposedTopesAmount
        intensity
        objectRequired
        competenceRequired
        toolingRequired
        multiplePeopleRequired
        requiredCompetenceText
        requiredToolingText
        requiredPeopleCount
        campaignNeedsByNeedId(first: 1, orderBy: PRIMARY_KEY_DESC) {
          nodes {
            campaignId
          }
        }
        needClaimsByNeedId(first: 20, orderBy: PRIMARY_KEY_DESC) {
          nodes {
            id
            claimerAccountId
            status
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const MY_CAMPAIGNS_QUERY = gql`
  query MyCampaigns($creatorAccountId: UUID!, $first: Int, $after: Cursor) {
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
        description
        imageUrl
        createdAt
        creatorAccountId
        moderationStatus
        startAt
        airdropAt
        endAt
        campaignResourcesByCampaignId {
          totalCount
        }
        campaignNeedsByCampaignId {
          totalCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const RESOURCE_BY_ID_QUERY = gql`
  query ResourceById($id: UUID!) {
    resourceById(id: $id) {
      id
      title
      description
      defaultTokenAmount
      categoryLabels
      imageUrls
    }
  }
`;

export const NEED_BY_ID_QUERY = gql`
  query NeedById($id: UUID!) {
    needById(id: $id) {
      id
      title
      description
      proposedTopesAmount
      intensity
    }
  }
`;

export const CAMPAIGN_BY_ID_QUERY = gql`
  query CampaignById($id: UUID!) {
    campaignById(id: $id) {
      id
      title
      description
      moderationStatus
      startAt
      endAt
    }
  }
`;

export const CREATE_RESOURCE_MUTATION = gql`
  mutation CreateResource($input: CreateResourceInput!) {
    createResource(input: $input) {
      resource {
        id
        title
      }
    }
  }
`;

export const CREATE_NEED_MUTATION = gql`
  mutation CreateNeed($input: CreateNeedInput!) {
    createNeed(input: $input) {
      need {
        id
        title
      }
    }
  }
`;

export const CLAIM_NEED_MUTATION = gql`
  mutation ClaimNeed($input: ClaimNeedInput!) {
    claimNeed(input: $input) {
      needClaim {
        id
        needId
        claimerAccountId
        status
      }
    }
  }
`;

export const CREATE_CAMPAIGN_MUTATION = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      campaign {
        id
        title
        moderationStatus
      }
    }
  }
`;

export const UPDATE_RESOURCE_BY_ID_MUTATION = gql`
  mutation UpdateResourceById($id: UUID!, $resourcePatch: ResourcePatch!) {
    updateResourceById(input: { id: $id, resourcePatch: $resourcePatch }) {
      resource {
        id
        title
        description
        defaultTokenAmount
        imageUrls
        isActive
        isProduct
        isService
        canBeTakenAway
        canBeDelivered
        canBeExchanged
        canBeGiven
        location
        latitude
        longitude
        expiresAt
        updatedAt
      }
    }
  }
`;

export const DELETE_RESOURCE_BY_ID_MUTATION = gql`
  mutation DeleteResourceById($id: UUID!) {
    deleteResourceById(input: { id: $id }) {
      deletedResourceId
    }
  }
`;

export const UPDATE_NEED_BY_ID_MUTATION = gql`
  mutation UpdateNeedById($id: UUID!, $needPatch: NeedPatch!) {
    updateNeedById(input: { id: $id, needPatch: $needPatch }) {
      need {
        id
        title
        description
        proposedTopesAmount
      }
    }
  }
`;

export const UPDATE_CAMPAIGN_BY_ID_MUTATION = gql`
  mutation UpdateCampaignById($id: UUID!, $campaignPatch: CampaignPatch!) {
    updateCampaignById(input: { id: $id, campaignPatch: $campaignPatch }) {
      campaign {
        id
        title
        description
        moderationStatus
      }
    }
  }
`;

export const SENT_RESOURCE_BIDS_QUERY = gql`
  query SentResourceBids($first: Int, $after: Cursor, $activeOnly: Boolean) {
    sentResourceBids(first: $first, after: $after, activeOnly: $activeOnly) {
      nodes {
        id
        message
        proposedTokenAmount
        isActive
        status
        updatedAt
        resourceByResourceId {
          id
          title
        }
        accountByBidderAccountId {
          id
          displayName
        }
        accountByRespondedByAccountId {
          id
          displayName
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const RECEIVED_RESOURCE_BIDS_QUERY = gql`
  query ReceivedResourceBids($first: Int, $after: Cursor, $activeOnly: Boolean) {
    receivedResourceBids(first: $first, after: $after, activeOnly: $activeOnly) {
      nodes {
        id
        message
        proposedTokenAmount
        isActive
        status
        updatedAt
        resourceByResourceId {
          id
          title
        }
        accountByBidderAccountId {
          id
          displayName
        }
        accountByRespondedByAccountId {
          id
          displayName
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const SENT_NEED_CLAIMS_QUERY = gql`
  query SentNeedClaims($condition: NeedClaimCondition, $first: Int, $after: Cursor) {
    allNeedClaims(
      condition: $condition
      first: $first
      after: $after
      orderBy: PRIMARY_KEY_DESC
    ) {
      nodes {
        id
        needId
        claimerAccountId
        status
        createdAt
        needByNeedId {
          id
          title
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const RECEIVED_NEED_CLAIMS_QUERY = gql`
  query ReceivedNeedClaims($creatorAccountId: UUID!, $first: Int, $after: Cursor) {
    allNeeds(
      condition: { creatorAccountId: $creatorAccountId }
      first: $first
      after: $after
      orderBy: PRIMARY_KEY_DESC
    ) {
      nodes {
        id
        title
        needClaimsByNeedId(first: 20, orderBy: PRIMARY_KEY_DESC) {
          nodes {
            id
            needId
            claimerAccountId
            status
            createdAt
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const CHAT_CONVERSATIONS_QUERY = gql`
  query ChatConversations($first: Int, $after: Cursor) {
    allChatConversationSummaries(first: $first, after: $after) {
      nodes {
        conversationId
        conversationKind
        contextTitle
        lastMessagePreview
        lastActivityAt
        otherAccountId
        unreadCount
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const RESOURCE_CONVERSATION_BY_ID_QUERY = gql`
  query ResourceConversationById($id: UUID!) {
    resourceConversationById(id: $id) {
      id
      resourceId
      ownerAccountId
      bidderAccountId
      resourceByResourceId {
        id
        title
      }
      accountByOwnerAccountId {
        id
        displayName
      }
      accountByBidderAccountId {
        id
        displayName
      }
    }
  }
`;

export const RESOURCE_MESSAGES_QUERY = gql`
  query ResourceMessages($conversationId: UUID!, $first: Int, $after: Cursor) {
    allResourceMessages(
      condition: { conversationId: $conversationId }
      first: $first
      after: $after
      orderBy: ID_ASC
    ) {
      nodes {
        id
        body
        createdAt
        senderAccountId
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const CREATE_RESOURCE_MESSAGE_MUTATION = gql`
  mutation CreateResourceMessage($input: CreateResourceMessageInput!) {
    createResourceMessage(input: $input) {
      resourceMessage {
        id
        body
        createdAt
        senderAccountId
      }
    }
  }
`;

export const MARK_RESOURCE_MESSAGES_READ_MUTATION = gql`
  mutation MarkResourceMessagesRead($input: MarkResourceMessagesReadInput!) {
    markResourceMessagesRead(input: $input) {
      integer
    }
  }
`;

export const ACCOUNT_NOTIFICATIONS_QUERY = gql`
  query AccountNotifications($condition: AccountNotificationCondition, $first: Int, $after: Cursor) {
    allAccountNotifications(
      condition: $condition
      first: $first
      after: $after
      orderBy: CREATED_AT_DESC
    ) {
      nodes {
        id
        eventType
        payload
        createdAt
        readAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const MARK_ACCOUNT_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkAccountNotificationRead($input: MarkAccountNotificationReadInput!) {
    markAccountNotificationRead(input: $input) {
      accountNotification {
        id
        readAt
      }
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead($input: MarkAllNotificationsReadInput!) {
    markAllNotificationsRead(input: $input) {
      integer
    }
  }
`;

export const ACCOUNT_PROFILE_QUERY = gql`
  query AccountProfile($id: UUID!) {
    accountById(id: $id) {
      id
      displayName
      avatarUrl
      bio
      location
      preferredLanguage
    }
  }
`;

export const UPDATE_ACCOUNT_PROFILE_MUTATION = gql`
  mutation UpdateAccountProfile($id: UUID!, $accountPatch: AccountPatch!) {
    updateAccountById(input: { id: $id, accountPatch: $accountPatch }) {
      account {
        id
        displayName
        avatarUrl
        bio
        location
      }
    }
  }
`;

export const CURRENT_TOKEN_BALANCE_QUERY = gql`
  query CurrentTokenBalance {
    currentTokenBalance
  }
`;

export const TOKEN_HISTORY_QUERY = gql`
  query TokenHistory($condition: TokenMovementCondition, $first: Int, $after: Cursor) {
    allTokenMovements(
      condition: $condition
      first: $first
      after: $after
      orderBy: PRIMARY_KEY_DESC
    ) {
      nodes {
        id
        amountDelta
        eventType
        createdAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const ACCOUNT_DELIVERY_PREFERENCES_QUERY = gql`
  query AccountDeliveryPreferences($condition: AccountDeliveryPreferenceCondition, $first: Int) {
    allAccountDeliveryPreferences(condition: $condition, first: $first) {
      nodes {
        accountId
        eventCategory
        deliveryStrategy
        summaryFrequencyDays
      }
    }
  }
`;

export const UPDATE_ACCOUNT_DELIVERY_PREFERENCE_MUTATION = gql`
  mutation UpdateAccountDeliveryPreference(
    $input: UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput!
  ) {
    updateAccountDeliveryPreferenceByAccountIdAndEventCategory(input: $input) {
      accountDeliveryPreference {
        accountId
        eventCategory
        deliveryStrategy
        summaryFrequencyDays
      }
    }
  }
`;

export const CREATE_ACCOUNT_DELIVERY_PREFERENCE_MUTATION = gql`
  mutation CreateAccountDeliveryPreference($input: CreateAccountDeliveryPreferenceInput!) {
    createAccountDeliveryPreference(input: $input) {
      accountDeliveryPreference {
        accountId
        eventCategory
        deliveryStrategy
        summaryFrequencyDays
      }
    }
  }
`;

export const INSPIRATION_CAMPAIGNS_QUERY = gql`
  query InspirationCampaigns {
    allCampaigns(condition: { moderationStatus: APPROVED }, orderBy: CREATED_AT_DESC, first: 10) {
      nodes {
        id
        title
        theme
        imageUrl
        moderationStatus
        startAt
        airdropAt
        endAt
        createdAt
      }
    }
  }
`;

