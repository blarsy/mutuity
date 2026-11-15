import { gql } from "@apollo/client";

export const CAMPAIGN_RESOURCE_TRIAGE_QUERY = gql`
  query CampaignResourceTriage($campaignId: UUID) {
    allCampaignResources(condition: { campaignId: $campaignId }, orderBy: [SUBMITTED_AT_DESC]) {
      nodes {
        campaignId
        resourceId
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
        resourceByResourceId {
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
          defaultTokenAmount
        }
      }
    }
  }
`;

export const ACCEPT_CAMPAIGN_RESOURCE_MUTATION = gql`
  mutation AcceptCampaignResource($campaignId: UUID!, $resourceId: UUID!, $expectedSubmissionId: UUID!) {
    acceptCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId, expectedSubmissionId: $expectedSubmissionId }) {
      campaignResource {
        campaignId
        resourceId
        status
        actedByAccountId
        actedAt
      }
    }
  }
`;

export const REJECT_CAMPAIGN_RESOURCE_MUTATION = gql`
  mutation RejectCampaignResource($campaignId: UUID!, $resourceId: UUID!, $expectedSubmissionId: UUID!, $rejectionNote: String) {
    rejectCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId, expectedSubmissionId: $expectedSubmissionId, rejectionNote: $rejectionNote }) {
      campaignResource {
        campaignId
        resourceId
        status
        actedByAccountId
        actedAt
      }
    }
  }
`;
