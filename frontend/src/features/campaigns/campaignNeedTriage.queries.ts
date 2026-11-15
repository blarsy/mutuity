import { gql } from "@apollo/client";

export const CAMPAIGN_NEED_TRIAGE_QUERY = gql`
  query CampaignNeedTriage($campaignId: UUID) {
    allCampaignNeeds(condition: { campaignId: $campaignId }, orderBy: [SUBMITTED_AT_DESC]) {
      nodes {
        campaignId
        needId
        submissionId
        submittedAt
        rejectionNote
        isCurrent
        status
        createdAt
        actedAt
        actedByAccountId
        campaignByCampaignId {
          id
          title
          startAt
          endAt
        }
        needByNeedId {
          id
          title
          description
          imageUrls
          expiresAt
          createdAt
          accountByCreatorAccountId {
            id
            displayName
            avatarUrl
          }
          location
          intensity
          proposedTopesAmount
        }
      }
    }
  }
`;

export const ACCEPT_CAMPAIGN_NEED_MUTATION = gql`
  mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!) {
    acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId }) {
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
  mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!, $rejectionNote: String) {
    rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId, rejectionNote: $rejectionNote }) {
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
