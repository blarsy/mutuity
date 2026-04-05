import { gql } from "@apollo/client";

export const PUBLIC_RESOURCES_QUERY = gql`
  query PublicResources(
    $latitude: BigFloat
    $longitude: BigFloat
    $browserLatitude: BigFloat
    $browserLongitude: BigFloat
    $searchText: String
    $categoryLabels: [String!]
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
      categoryLabels: $categoryLabels
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
        distanceKm
        queryLatitude
        queryLongitude
      }
    }
  }
`;
