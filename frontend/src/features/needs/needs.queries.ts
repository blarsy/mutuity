import { gql } from "@apollo/client";

export const CREATE_NEED_MUTATION = gql`
  mutation CreateNeed(
    $title: String!
    $description: String
    $location: String!
    $latitude: BigFloat
    $longitude: BigFloat
    $intensity: NeedIntensity!
    $proposedTopesAmount: Int
    $objectRequired: Boolean
    $competenceRequired: Boolean
    $toolingRequired: Boolean
    $multiplePeopleRequired: Boolean
    $requiredCompetenceText: String
    $requiredToolingText: String
    $requiredPeopleCount: Int
    $campaignId: UUID
    $imageUrls: [String!]
    $expiresAt: Datetime
  ) {
    createNeed(
      input: {
        title: $title
        description: $description
        location: $location
        latitude: $latitude
        longitude: $longitude
        intensity: $intensity
        proposedTopesAmount: $proposedTopesAmount
        objectRequired: $objectRequired
        competenceRequired: $competenceRequired
        toolingRequired: $toolingRequired
        multiplePeopleRequired: $multiplePeopleRequired
        requiredCompetenceText: $requiredCompetenceText
        requiredToolingText: $requiredToolingText
        requiredPeopleCount: $requiredPeopleCount
        campaignId: $campaignId
        imageUrls: $imageUrls
        expiresAt: $expiresAt
      }
    ) {
      need {
        id
        title
        intensity
        proposedTopesAmount
      }
    }
  }
`;

export const UPDATE_NEED_MUTATION = gql`
  mutation UpdateNeed(
    $id: UUID!
    $title: String!
    $description: String
    $location: String!
    $latitude: BigFloat
    $longitude: BigFloat
    $intensity: NeedIntensity!
    $proposedTopesAmount: Int
    $objectRequired: Boolean
    $competenceRequired: Boolean
    $toolingRequired: Boolean
    $multiplePeopleRequired: Boolean
    $requiredCompetenceText: String
    $requiredToolingText: String
    $requiredPeopleCount: Int
    $imageUrls: [String!]
    $expiresAt: Datetime
  ) {
    updateNeedById(
      input: {
        id: $id
        needPatch: {
          title: $title
          description: $description
          location: $location
          latitude: $latitude
          longitude: $longitude
          intensity: $intensity
          proposedTopesAmount: $proposedTopesAmount
          objectRequired: $objectRequired
          competenceRequired: $competenceRequired
          toolingRequired: $toolingRequired
          multiplePeopleRequired: $multiplePeopleRequired
          requiredCompetenceText: $requiredCompetenceText
          requiredToolingText: $requiredToolingText
          requiredPeopleCount: $requiredPeopleCount
          imageUrls: $imageUrls
          expiresAt: $expiresAt
        }
      }
    ) {
      need {
        id
        title
        intensity
        proposedTopesAmount
      }
    }
  }
`;

export const NEED_EDIT_DETAIL_QUERY = gql`
  query NeedEditDetail($needId: UUID!) {
    needById(id: $needId) {
      id
      title
      description
      location
      latitude
      longitude
      intensity
      proposedTopesAmount
      objectRequired
      competenceRequired
      toolingRequired
      multiplePeopleRequired
      requiredCompetenceText
      requiredToolingText
      requiredPeopleCount
      imageUrls
      expiresAt
      campaignNeedsByNeedId(first: 1, orderBy: CREATED_AT_DESC) {
        nodes {
          campaignId
        }
      }
    }
  }
`;

export const LINKABLE_CAMPAIGN_OPTIONS_QUERY = gql`
  query LinkableCampaignOptions {
    allCampaigns(condition: { moderationStatus: APPROVED }, orderBy: START_AT_ASC) {
      nodes {
        id
        title
        startAt
        endAt
      }
    }
  }
`;

export const PUBLIC_NEEDS_QUERY = gql`
  query PublicNeeds(
    $latitude: BigFloat
    $longitude: BigFloat
    $browserLatitude: BigFloat
    $browserLongitude: BigFloat
    $searchText: String
    $multiplePeopleRequired: TriStateFilter
    $toolingRequired: TriStateFilter
    $competenceRequired: TriStateFilter
    $objectRequired: TriStateFilter
    $limitCount: Int
  ) {
    searchNeeds(
      latitude: $latitude
      longitude: $longitude
      browserLatitude: $browserLatitude
      browserLongitude: $browserLongitude
      searchText: $searchText
      multiplePeopleRequired: $multiplePeopleRequired
      toolingRequired: $toolingRequired
      competenceRequired: $competenceRequired
      objectRequired: $objectRequired
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
        proposedTopesAmount
        objectRequired
        competenceRequired
        toolingRequired
        multiplePeopleRequired
        requiredCompetenceText
        requiredToolingText
        requiredPeopleCount
        imageUrls
        expiresAt
        createdAt
        closenessScore
        easeOfSetupScore
        expirationScore
        weightedScore
        queryLatitude
        queryLongitude
      }
    }
  }
`;

export const MY_NEEDS_CONNECTION_QUERY = gql`
  query MyNeedsConnection($creatorAccountId: UUID!, $first: Int!, $after: Cursor) {
    allNeeds(
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
        intensity
        proposedTopesAmount
        objectRequired
        competenceRequired
        toolingRequired
        multiplePeopleRequired
        requiredPeopleCount
        imageUrls
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

export const SOFT_DELETE_NEED_MUTATION = gql`
  mutation SoftDeleteNeed($id: UUID!) {
    updateNeedById(input: { id: $id, needPatch: { isActive: false } }) {
      need {
        id
        isActive
        updatedAt
      }
    }
  }
`;
