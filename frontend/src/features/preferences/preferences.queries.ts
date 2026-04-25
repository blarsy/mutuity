import { gql } from "@apollo/client";

export const GET_DELIVERY_PREFERENCES_MUTATION = gql`
  mutation GetDeliveryPreferences {
    getAccountDeliveryPreferences(input: {}) {
      results {
        eventCategory
        deliveryStrategy
        summaryFrequencyDays
      }
    }
  }
`;

export const SET_DELIVERY_PREFERENCE_MUTATION = gql`
  mutation SetDeliveryPreference(
    $eventCategory: String!
    $deliveryStrategy: String!
    $summaryFrequencyDays: Int
  ) {
    setAccountDeliveryPreference(
      input: {
        pEventCategory: $eventCategory
        pDeliveryStrategy: $deliveryStrategy
        pSummaryFrequencyDays: $summaryFrequencyDays
      }
    ) {
      accountDeliveryPreference {
        eventCategory
        deliveryStrategy
        summaryFrequencyDays
      }
    }
  }
`;
