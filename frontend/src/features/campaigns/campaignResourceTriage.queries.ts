import { gql } from "@apollo/client";

export const CAMPAIGN_RESOURCE_TRIAGE_QUERY = gql`
  query CampaignResourceTriage($campaignId: UUID) {
    allCampaignResources(condition: { campaignId: $campaignId }, orderBy: [PRIMARY_KEY_DESC]) {
      nodes {
        campaignId
        resourceId
        status
        createdAt
        actedAt
        actedByAccountId
        campaignByCampaignId {
          id
          title
        }
        resourceByResourceId {
          id
          title
          location
          defaultTokenAmount
        }
      }
    }
  }
`;

export const ACCEPT_CAMPAIGN_RESOURCE_MUTATION = gql`
  mutation AcceptCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
    acceptCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
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
  mutation RejectCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
    rejectCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
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
