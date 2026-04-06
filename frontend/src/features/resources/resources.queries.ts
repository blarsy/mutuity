import { gql } from "@apollo/client";

export const PUBLISH_RESOURCE_MUTATION = gql`
  mutation PublishResource(
    $title: String!
    $description: String
    $location: String!
    $latitude: BigFloat!
    $longitude: BigFloat!
    $intensity: NeedIntensity!
    $defaultTokenAmount: Int
    $categoryCodes: [Int!]
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
        title: $title
        description: $description
        location: $location
        latitude: $latitude
        longitude: $longitude
        intensity: $intensity
        defaultTokenAmount: $defaultTokenAmount
        categoryCodes: $categoryCodes
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
        distanceKm
        queryLatitude
        queryLongitude
      }
    }
  }
`;
