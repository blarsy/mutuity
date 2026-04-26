import { gql } from "@apollo/client";

export const ADMIN_LIST_ACCOUNTS_QUERY = gql`
  query AdminListAccounts($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListAccounts(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        name
        email
        language
        tokenAmount
        createdAt
        address
      }
    }
  }
`;

export const ADMIN_LIST_BIDS_QUERY = gql`
  query AdminListBids($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListBids(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        bidderName
        receiverName
        resourceTitle
        intensity
        tokenAmount
        status
        createdAt
        expirationDatetime
      }
    }
  }
`;

export const ADMIN_LIST_RESOURCES_QUERY = gql`
  query AdminListResources($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListResources(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        title
        creatorName
        intensity
        tokenAmount
        imageCount
        location
        createdAt
        expirationDatetime
      }
    }
  }
`;

export const ADMIN_LIST_NOTIFICATIONS_QUERY = gql`
  query AdminListNotifications($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListNotifications(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        accountName
        data
        createdAt
        readAt
      }
    }
  }
`;

export const ADMIN_LIST_MAILS_QUERY = gql`
  query AdminListMails($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListMails(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        email
        subject
        recipientAccountName
        createdAt
      }
    }
  }
`;

export const ADMIN_LIST_CAMPAIGNS_QUERY = gql`
  query AdminListCampaigns($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListCampaigns(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        creatorName
        summary
        description
        airdropDatetime
        airdropTokenAmount
        beginDatetime
        endDatetime
        resourceRewardsMultiplier
        createdAt
      }
    }
  }
`;

export const ADMIN_LIST_GRANTS_QUERY = gql`
  query AdminListGrants($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListGrants(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        id
        title
        description
        expirationDatetime
        amountGranted
        createdAt
      }
    }
  }
`;

export const ADMIN_LIST_LOGS_QUERY = gql`
  query AdminListLogs($pSearch: String, $pLimit: Int = 25, $pOffset: Int = 0) {
    adminListLogs(pSearch: $pSearch, pLimit: $pLimit, pOffset: $pOffset) {
      totalCount
      nodes {
        component
        severity
        message
        context
        timestamp
      }
    }
  }
`;
