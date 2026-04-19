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
    allCampaignModerationNotes(condition: { campaignId: $campaignId }, orderBy: CREATED_AT_ASC) {
      nodes {
        id
        campaignId
        managerAccountId
        body
        createdAt
      }
    }
  }
`;
