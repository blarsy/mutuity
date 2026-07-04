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
  query SearchResources($first: Int, $after: Cursor) {
    allResources(first: $first, after: $after) {
      nodes {
        id
        title
        description
        defaultTokenAmount
        categoryLabels
        imageUrls
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const MY_RESOURCES_QUERY = gql`
  query MyResources($creatorAccountId: UUID!, $first: Int, $after: Cursor) {
    allResources(
      condition: { creatorAccountId: $creatorAccountId }
      first: $first
      after: $after
    ) {
      nodes {
        id
        title
        defaultTokenAmount
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
        title
        description
        proposedTopesAmount
        intensity
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
        title
        proposedTopesAmount
        intensity
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
      first: $first
      after: $after
    ) {
      nodes {
        id
        title
        moderationStatus
        startAt
        endAt
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
      }
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
