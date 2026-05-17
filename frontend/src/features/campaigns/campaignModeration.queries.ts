import { gql } from "@apollo/client";

export const ADD_CAMPAIGN_MODERATION_NOTE_MUTATION = gql`
  mutation AddCampaignModerationNote($campaignId: UUID!, $body: String!) {
    addCampaignModerationNote(input: { campaignId: $campaignId, body: $body }) {
      campaignModerationNote {
        id
        campaignId
        managerAccountId
        body
        createdAt
      }
    }
  }
`;

export const CAMPAIGN_MODERATION_HISTORY_QUERY = gql`
  query CampaignModerationHistory($campaignId: UUID!) {
    campaignModerationEvents(pCampaignId: $campaignId) {
      nodes {
        eventType
        body
        actorAccountId
        createdAt
      }
    }
  }
`;

export const UPDATE_CAMPAIGN_FOR_MODERATION_MUTATION = gql`
  mutation UpdateCampaignForModeration(
    $pCampaignId: UUID!
    $pTitle: String!
    $pTheme: String!
    $pDescription: String!
    $pManagerNoteFromCreator: String
    $pRewardsMultiplier: Int!
    $pAirdropAmount: Int!
    $pStartAt: Datetime!
    $pAirdropAt: Datetime!
    $pEndAt: Datetime!
    $pImageUrl: String
  ) {
    updateCampaignForModeration(
      input: {
        pCampaignId: $pCampaignId
        pTitle: $pTitle
        pTheme: $pTheme
        pDescription: $pDescription
        pManagerNoteFromCreator: $pManagerNoteFromCreator
        pRewardsMultiplier: $pRewardsMultiplier
        pAirdropAmount: $pAirdropAmount
        pStartAt: $pStartAt
        pAirdropAt: $pAirdropAt
        pEndAt: $pEndAt
        pImageUrl: $pImageUrl
      }
    ) {
      campaign {
        id
        title
        theme
        description
        imageUrl
        managerNoteFromCreator
        rewardsMultiplier
        airdropAmount
        startAt
        airdropAt
        endAt
        moderationStatus
        createdAt
      }
    }
  }
`;

export const CAMPAIGN_MODERATION_DETAILS_QUERY = gql`
  query CampaignModerationDetails($campaignId: UUID!) {
    campaignById(id: $campaignId) {
      id
      title
      theme
      description
      imageUrl
      managerNoteFromCreator
      rewardsMultiplier
      airdropAmount
      startAt
      airdropAt
      endAt
      moderationStatus
      createdAt
    }
  }
`;
