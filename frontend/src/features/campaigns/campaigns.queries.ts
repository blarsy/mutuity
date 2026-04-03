import { gql } from "@apollo/client";

export const CREATE_CAMPAIGN_MUTATION = gql`
  mutation CreateCampaign(
    $title: String!
    $theme: String!
    $managerNoteFromCreator: String
    $rewardsMultiplier: Int!
    $airdropAmount: Int!
    $startAt: Datetime!
    $airdropAt: Datetime!
    $endAt: Datetime!
  ) {
    createCampaign(
      input: {
        title: $title
        theme: $theme
        managerNoteFromCreator: $managerNoteFromCreator
        rewardsMultiplier: $rewardsMultiplier
        airdropAmount: $airdropAmount
        startAt: $startAt
        airdropAt: $airdropAt
        endAt: $endAt
      }
    ) {
      campaign {
        id
        title
        moderationStatus
        startAt
        airdropAt
        endAt
      }
    }
  }
`;

export const MY_CAMPAIGNS_QUERY = gql`
  query MyCampaigns {
    allCampaigns(orderBy: CREATED_AT_DESC) {
      nodes {
        id
        title
        moderationStatus
        startAt
        endAt
      }
    }
  }
`;
