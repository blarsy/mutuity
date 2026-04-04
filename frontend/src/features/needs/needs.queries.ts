import { gql } from "@apollo/client";

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
