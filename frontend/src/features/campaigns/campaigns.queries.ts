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

export const PUBLIC_CAMPAIGNS_QUERY = gql`
  query PublicCampaigns {
    allCampaigns(condition: { moderationStatus: APPROVED }, orderBy: START_AT_ASC) {
      nodes {
        id
        title
        theme
        moderationStatus
        startAt
        airdropAt
        endAt
      }
    }
  }
`;

export const APPROVE_CAMPAIGN_MUTATION = gql`
  mutation ApproveCampaign($campaignId: UUID!) {
    approveCampaign(input: { campaignId: $campaignId }) {
      campaign {
        id
        moderationStatus
      }
    }
  }
`;

export const MY_CAMPAIGNS_CONNECTION_QUERY = gql`
  query MyCampaignsConnection($creatorAccountId: UUID!, $first: Int!, $after: Cursor) {
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
        moderationStatus
        startAt
        airdropAt
        endAt
        createdAt
      }
      pageInfo {
        hasNextPage
        endCursor
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
        moderationStatus
        startAt
        airdropAt
        endAt
        createdAt
      }
    }
  }
`;
