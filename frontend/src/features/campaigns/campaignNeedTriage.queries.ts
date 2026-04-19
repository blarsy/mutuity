import { gql } from "@apollo/client";

export const CAMPAIGN_NEED_TRIAGE_QUERY = gql`
  query CampaignNeedTriage($campaignId: UUID) {
    allCampaignNeeds(condition: { campaignId: $campaignId }, orderBy: [CREATED_AT_DESC]) {
      nodes {
        campaignId
        needId
        status
        createdAt
        actedAt
        actedByAccountId
        campaignByCampaignId {
          id
          title
        }
        needByNeedId {
          id
          title
          location
          intensity
          proposedTopesAmount
        }
      }
    }
  }
`;

export const ACCEPT_CAMPAIGN_NEED_MUTATION = gql`
  mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!) {
    acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
      campaignNeed {
        campaignId
        needId
        status
        actedByAccountId
        actedAt
      }
    }
  }
`;

export const REJECT_CAMPAIGN_NEED_MUTATION = gql`
  mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!) {
    rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
      campaignNeed {
        campaignId
        needId
        status
        actedByAccountId
        actedAt
      }
    }
  }
`;
