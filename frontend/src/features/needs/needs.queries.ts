import { gql } from "@apollo/client";

export const PUBLIC_NEEDS_QUERY = gql`
  query PublicNeeds(
    $latitude: BigFloat
    $longitude: BigFloat
    $searchText: String
    $limitCount: Int
  ) {
    searchNeeds(
      latitude: $latitude
      longitude: $longitude
      searchText: $searchText
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
