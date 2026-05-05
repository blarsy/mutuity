import { gql } from "@apollo/client";

export const PUBLISH_RESOURCE_MUTATION = gql`
  mutation PublishResource(
    $resourceId: UUID
    $title: String!
    $description: String
    $location: String!
    $latitude: BigFloat!
    $longitude: BigFloat!
    $intensity: NeedIntensity!
    $defaultTokenAmount: Int
    $categoryCodes: [Int!]
    $imageUrls: [String!]
    $isProduct: Boolean!
    $isService: Boolean!
    $canBeGiven: Boolean!
    $canBeExchanged: Boolean!
    $canBeTakenAway: Boolean!
    $canBeDelivered: Boolean!
    $expiresAt: Datetime
  ) {
    publishResource(
      input: {
        resourceId: $resourceId
        title: $title
        description: $description
        location: $location
        latitude: $latitude
        longitude: $longitude
        intensity: $intensity
        defaultTokenAmount: $defaultTokenAmount
        categoryCodes: $categoryCodes
        imageUrls: $imageUrls
        isProduct: $isProduct
        isService: $isService
        canBeGiven: $canBeGiven
        canBeExchanged: $canBeExchanged
        canBeTakenAway: $canBeTakenAway
        canBeDelivered: $canBeDelivered
        expiresAt: $expiresAt
      }
    ) {
      resource {
        id
        title
        intensity
        defaultTokenAmount
        categoryLabels
        expiresAt
        isActive
      }
    }
  }
`;

export const RESOURCE_CATEGORY_OPTIONS_QUERY = gql`
  query ResourceCategoryOptions {
    allResourceCategories(condition: { isActive: true }, orderBy: CODE_ASC) {
      nodes {
        code
        slug
        label
        labelFr
        sortOrder
      }
    }
  }
`;

export const PUBLIC_RESOURCES_QUERY = gql`
  query PublicResources(
    $latitude: BigFloat
    $longitude: BigFloat
    $browserLatitude: BigFloat
    $browserLongitude: BigFloat
    $searchText: String
    $categoryCodes: [Int!]
    $isProduct: TriStateFilter
    $isService: TriStateFilter
    $canBeGiven: TriStateFilter
    $canBeExchanged: TriStateFilter
    $canBeTakenAway: TriStateFilter
    $canBeDelivered: TriStateFilter
    $limitCount: Int
  ) {
    searchResources(
      latitude: $latitude
      longitude: $longitude
      browserLatitude: $browserLatitude
      browserLongitude: $browserLongitude
      searchText: $searchText
      categoryCodes: $categoryCodes
      isProduct: $isProduct
      isService: $isService
      canBeGiven: $canBeGiven
      canBeExchanged: $canBeExchanged
      canBeTakenAway: $canBeTakenAway
      canBeDelivered: $canBeDelivered
      limitCount: $limitCount
    ) {
      nodes {
        id
        creatorAccountId
        creatorDisplayName
        title
        description
        location
        latitude
        longitude
        intensity
        defaultTokenAmount
        categoryLabels
        isProduct
        isService
        canBeGiven
        canBeExchanged
        canBeTakenAway
        canBeDelivered
        expiresAt
        createdAt
        imageUrls
        distanceKm
        queryLatitude
        queryLongitude
      }
    }
  }
`;

export const RESOURCE_DETAIL_QUERY = gql`
  query ResourceDetail($resourceId: UUID!) {
    resourceById(id: $resourceId) {
      id
      creatorAccountId
      title
      description
      location
      latitude
      longitude
      intensity
      defaultTokenAmount
      imageUrls
      categoryLabels
      resourceCategoryAssignmentsByResourceId(orderBy: CATEGORY_CODE_ASC) {
        nodes {
          categoryCode
        }
      }
      isProduct
      isService
      canBeGiven
      canBeExchanged
      canBeTakenAway
      canBeDelivered
      expiresAt
      isActive
      createdAt
      updatedAt
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
      }
      resourceBidsByResourceId {
        nodes {
          id
          resourceId
          bidderAccountId
          message
          proposedTokenAmount
          status
          createdAt
          respondedAt
          respondedByAccountId
          accountByBidderAccountId {
            id
            displayName
            externalSubject
          }
        }
      }
    }
  }
`;

export const SOFT_DELETE_RESOURCE_MUTATION = gql`
  mutation SoftDeleteResource($id: UUID!) {
    updateResourceById(input: { id: $id, resourcePatch: { isActive: false } }) {
      resource {
        id
        isActive
        updatedAt
      }
    }
  }
`;

export const RESOURCE_OPEN_BID_COUNT_QUERY = gql`
  query ResourceOpenBidCount($resourceId: UUID!) {
    allResourceBids(condition: { resourceId: $resourceId, status: OPEN }) {
      totalCount
    }
  }
`;

export const RESOURCE_BIDS_OVERVIEW_QUERY = gql`
  query ResourceBidsOverview($first: Int = 100) {
    allResourceBids(first: $first) {
      nodes {
        id
        resourceId
        bidderAccountId
        message
        proposedTokenAmount
        status
        createdAt
        respondedAt
        respondedByAccountId
        accountByBidderAccountId {
          id
          displayName
          externalSubject
        }
        resourceByResourceId {
          id
          creatorAccountId
          title
          description
          location
          defaultTokenAmount
          categoryLabels
          isProduct
          isService
          canBeExchanged
          expiresAt
          createdAt
          accountByCreatorAccountId {
            id
            displayName
            externalSubject
          }
        }
      }
    }
  }
`;

export const MY_RESOURCES_CONNECTION_QUERY = gql`
  query MyResourcesConnection($creatorAccountId: UUID!, $first: Int!, $after: Cursor) {
    allResources(
      condition: { creatorAccountId: $creatorAccountId, isActive: true }
      orderBy: ID_DESC
      first: $first
      after: $after
    ) {
      nodes {
        id
        creatorAccountId
        title
        description
        location
        defaultTokenAmount
        imageUrls
        categoryLabels
        isProduct
        isService
        canBeGiven
        canBeExchanged
        canBeTakenAway
        canBeDelivered
        expiresAt
        createdAt
        updatedAt
        accountByCreatorAccountId {
          id
          displayName
          externalSubject
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const CREATE_RESOURCE_BID_MUTATION = gql`
  mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
    submitResourceBid(input: $input) {
      resourceBid {
        id
        resourceId
        bidderAccountId
        message
        proposedTokenAmount
        status
        createdAt
        respondedAt
        respondedByAccountId
      }
    }
  }
`;

export const RESPOND_TO_RESOURCE_BID_MUTATION = gql`
  mutation RespondToResourceBid($input: RespondToResourceBidInput!) {
    respondToResourceBid(input: $input) {
      resourceBid {
        id
        resourceId
        bidderAccountId
        message
        proposedTokenAmount
        status
        createdAt
        respondedAt
        respondedByAccountId
      }
    }
  }
`;

const BID_WORKSPACE_FIELDS = gql`
  fragment BidWorkspaceFields on ResourceBid {
    id
    resourceId
    bidderAccountId
    message
    proposedTokenAmount
    status
    isActive
    validUntil
    createdAt
    updatedAt
    respondedAt
    respondedByAccountId
    accountByBidderAccountId {
      id
      displayName
      externalSubject
    }
    resourceConversationByConversationId {
      id
    }
    resourceByResourceId {
      id
      creatorAccountId
      title
      description
      location
      defaultTokenAmount
      imageUrls
      categoryLabels
      isProduct
      isService
      canBeExchanged
      isActive
      expiresAt
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
      }
    }
  }
`;

export const SENT_BIDS_QUERY = gql`
  ${BID_WORKSPACE_FIELDS}
  query SentBids($activeOnly: Boolean!, $first: Int!, $after: Cursor) {
    sentResourceBids(activeOnly: $activeOnly, first: $first, after: $after) {
      nodes {
        ...BidWorkspaceFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const RECEIVED_BIDS_QUERY = gql`
  ${BID_WORKSPACE_FIELDS}
  query ReceivedBids($activeOnly: Boolean!, $first: Int!, $after: Cursor) {
    receivedResourceBids(activeOnly: $activeOnly, first: $first, after: $after) {
      nodes {
        ...BidWorkspaceFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const CANCEL_RESOURCE_BID_MUTATION = gql`
  mutation CancelResourceBid($input: CancelResourceBidInput!) {
    cancelResourceBid(input: $input) {
      resourceBid {
        id
        status
        updatedAt
      }
    }
  }
`;
