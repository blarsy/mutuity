import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  getSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  const response = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      identifier: account.identifier,
      password: account.password
    })
  });

  expect(response.status).toBe(200);

  return getSessionCookie(response);
}

describe("notifications center integration", () => {
  it("marks single notifications and marks all unread notifications as read across all sources", async () => {
    const stamp = Date.now();
    const recipient = await seedDemoAccount({
      identifier: `notifications-recipient-${stamp}@example.com`,
      displayName: "Notifications Recipient"
    });
    const claimer = await seedDemoAccount({
      identifier: `notifications-claimer-${stamp}@example.com`,
      displayName: "Helpful Claimer"
    });
    const bidder = await seedDemoAccount({
      identifier: `notifications-bidder-${stamp}@example.com`,
      displayName: "Helpful Bidder"
    });

    const need = await seedNeed({
      creatorAccount: recipient,
      title: `Need notification ${stamp}`
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "I can help with this need."
    });
    const resource = await seedResource({
      creatorAccount: recipient,
      title: `Resource notification ${stamp}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    const bidderCookie = await loginAs(bidder);
    const createBidResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "I can pick this up tomorrow."
          }
        }
      })
    });

    expect(createBidResponse.status).toBe(200);

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      await client.query(
        `
          insert into app_public.need_claim_notification (
            recipient_account_id,
            need_claim_id,
            event_type,
            payload
          )
          values (
            $1,
            $2,
            'claim_created',
            jsonb_build_object('needId', $3::text, 'needName', $4::text)
          )
        `,
        [recipient.accountId, claim.id, need.id, need.title]
      );

      await client.query(
        `
          insert into app_public.account_notification (
            recipient_account_id,
            event_type,
            payload
          )
          values (
            $1,
            'welcome_profile_reward',
            jsonb_build_object('url', '/profile')
          )
        `,
        [recipient.accountId]
      );
    } finally {
      await client.end();
    }

    const recipientCookie = await loginAs(recipient);
    const overviewResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: recipientCookie
      },
      body: JSON.stringify({
        query: `
          query NotificationsOverview($first: Int = 200) {
            allNeedClaimNotifications(first: $first) {
              nodes {
                id
                readAt
              }
            }
            allResourceBidNotifications(first: $first) {
              nodes {
                id
                readAt
              }
            }
            allAccountNotifications(first: $first) {
              nodes {
                id
                readAt
                eventType
              }
            }
          }
        `
      })
    });

    expect(overviewResponse.status).toBe(200);
    const overviewJson = await overviewResponse.json() as {
      data?: {
        allNeedClaimNotifications: { nodes: Array<{ id: string; readAt: string | null }> };
        allResourceBidNotifications: { nodes: Array<{ id: string; readAt: string | null }> };
        allAccountNotifications: { nodes: Array<{ id: string; readAt: string | null; eventType: string }> };
      };
    };

    const needNotificationId = overviewJson.data?.allNeedClaimNotifications.nodes.find(node => node.readAt == null)?.id;
    const resourceNotificationId = overviewJson.data?.allResourceBidNotifications.nodes.find(node => node.readAt == null)?.id;
    const accountNotificationId = overviewJson.data?.allAccountNotifications.nodes.find(node => node.eventType === "welcome_profile_reward")?.id;

    expect(needNotificationId).toBeTruthy();
    expect(resourceNotificationId).toBeTruthy();
    expect(accountNotificationId).toBeTruthy();

    const markAccountResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: recipientCookie
      },
      body: JSON.stringify({
        query: `
          mutation MarkAccountNotificationRead($input: MarkAccountNotificationReadInput!) {
            markAccountNotificationRead(input: $input) {
              accountNotification {
                id
                readAt
              }
            }
          }
        `,
        variables: {
          input: {
            notificationId: accountNotificationId
          }
        }
      })
    });

    expect(markAccountResponse.status).toBe(200);
    await expect(markAccountResponse.json()).resolves.toMatchObject({
      data: {
        markAccountNotificationRead: {
          accountNotification: {
            id: accountNotificationId,
            readAt: expect.any(String)
          }
        }
      }
    });

    const markAllResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: recipientCookie
      },
      body: JSON.stringify({
        query: `
          mutation MarkAllNotificationsRead($input: MarkAllNotificationsReadInput!) {
            markAllNotificationsRead(input: $input) {
              integer
            }
          }
        `,
        variables: {
          input: {}
        }
      })
    });

    expect(markAllResponse.status).toBe(200);
    await expect(markAllResponse.json()).resolves.toMatchObject({
      data: {
        markAllNotificationsRead: {
          integer: expect.any(Number)
        }
      }
    });

    const checkClient = new Client({ connectionString: TEST_DATABASE_URL });
    await checkClient.connect();

    try {
      const needNotification = await checkClient.query<{ read_at: string | null }>(
        "select read_at::text from app_public.need_claim_notification where need_claim_id = $1 order by created_at desc limit 1",
        [claim.id]
      );
      const resourceNotification = await checkClient.query<{ read_at: string | null }>(
        "select read_at::text from app_public.resource_bid_notification where recipient_account_id = $1 and resource_bid_id is not null order by created_at desc limit 1",
        [recipient.accountId]
      );
      const accountNotification = await checkClient.query<{ read_at: string | null }>(
        "select read_at::text from app_public.account_notification where id = $1",
        [accountNotificationId]
      );

      expect(needNotification.rows[0]?.read_at).toBeTruthy();
      expect(resourceNotification.rows[0]?.read_at).toBeTruthy();
      expect(accountNotification.rows[0]?.read_at).toBeTruthy();
    } finally {
      await checkClient.end();
    }
  });

  it("cleans up only notifications old enough and already read long enough", async () => {
    const stamp = Date.now();
    const manager = await seedDemoAccount({
      identifier: `notifications-manager-${stamp}@example.com`,
      displayName: "Notifications Manager",
      role: "manager"
    });
    const needOwner = await seedDemoAccount({
      identifier: `notifications-owner-${stamp}@example.com`,
      displayName: "Need Owner"
    });
    const claimer = await seedDemoAccount({
      identifier: `notifications-cleanup-claimer-${stamp}@example.com`,
      displayName: "Cleanup Claimer"
    });
    const bidder = await seedDemoAccount({
      identifier: `notifications-cleanup-bidder-${stamp}@example.com`,
      displayName: "Cleanup Bidder"
    });

    const need = await seedNeed({ creatorAccount: needOwner, title: `Cleanup need ${stamp}` });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });
    const resource = await seedResource({ creatorAccount: needOwner, title: `Cleanup resource ${stamp}` });

    const bidderCookie = await loginAs(bidder);
    const createBidResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "Cleanup path"
          }
        }
      })
    });
    const createBidJson = await createBidResponse.json() as {
      data?: { submitResourceBid: { resourceBid: { id: string } } };
    };
    const resourceBidId = createBidJson.data?.submitResourceBid.resourceBid.id;

    expect(resourceBidId).toBeTruthy();

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      await client.query(
        `
          insert into app_public.need_claim_notification (
            recipient_account_id,
            need_claim_id,
            event_type,
            payload
          )
          values (
            $1,
            $2,
            'claim_created',
            jsonb_build_object('needId', $3::text, 'needName', $4::text)
          )
        `,
        [needOwner.accountId, claim.id, need.id, need.title]
      );

      const needNotificationIdResult = await client.query<{ id: string }>(
        "select id from app_public.need_claim_notification where need_claim_id = $1 order by created_at desc limit 1",
        [claim.id]
      );
      const resourceNotificationIdResult = await client.query<{ id: string }>(
        "select id from app_public.resource_bid_notification where resource_bid_id = $1 order by created_at desc limit 1",
        [resourceBidId]
      );
      const accountNotificationResult = await client.query<{ id: string }>(
        `
          insert into app_public.account_notification (recipient_account_id, event_type, payload)
          values ($1, 'gift_tokens_received', jsonb_build_object('senderName', 'Cleanup Sender', 'amountReceived', 25, 'url', '/contribution'))
          returning id
        `,
        [needOwner.accountId]
      );

      await client.query(
        `
          update app_public.need_claim_notification
          set created_at = now() - interval '8 days',
              read_at = now() - interval '2 days'
          where id = $1
        `,
        [needNotificationIdResult.rows[0]?.id]
      );
      await client.query(
        `
          update app_public.resource_bid_notification
          set created_at = now() - interval '8 days',
              read_at = now() - interval '2 days'
          where id = $1
        `,
        [resourceNotificationIdResult.rows[0]?.id]
      );
      await client.query(
        `
          update app_public.account_notification
          set created_at = now() - interval '8 days',
              read_at = now() - interval '2 days'
          where id = $1
        `,
        [accountNotificationResult.rows[0]?.id]
      );

      await client.query(
        `
          insert into app_public.account_notification (
            recipient_account_id,
            event_type,
            payload,
            created_at,
            read_at
          )
          values (
            $1,
            'campaign_airdrop_done',
            jsonb_build_object('campaignName', 'Still fresh', 'url', '/contribution'),
            now() - interval '2 days',
            now() - interval '1 hour'
          )
        `,
        [needOwner.accountId]
      );
    } finally {
      await client.end();
    }

    const managerCookie = await loginAs(manager);
    const cleanupResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: managerCookie
      },
      body: JSON.stringify({
        query: `
          mutation CleanupReadNotifications($input: CleanupReadNotificationsInput!) {
            cleanupReadNotifications(input: $input) {
              integer
            }
          }
        `,
        variables: {
          input: {}
        }
      })
    });

    expect(cleanupResponse.status).toBe(200);
    await expect(cleanupResponse.json()).resolves.toMatchObject({
      data: {
        cleanupReadNotifications: {
          integer: 3
        }
      }
    });

    const checkClient = new Client({ connectionString: TEST_DATABASE_URL });
    await checkClient.connect();

    try {
      const remainingNeed = await checkClient.query<{ count: string }>(
        "select count(*)::text as count from app_public.need_claim_notification where need_claim_id = $1",
        [claim.id]
      );
      const remainingResource = await checkClient.query<{ count: string }>(
        "select count(*)::text as count from app_public.resource_bid_notification where resource_bid_id = $1",
        [resourceBidId]
      );
      const freshAccountNotifications = await checkClient.query<{ count: string }>(
        "select count(*)::text as count from app_public.account_notification where recipient_account_id = $1 and event_type = 'campaign_airdrop_done'",
        [needOwner.accountId]
      );

      expect(remainingNeed.rows[0]?.count).toBe("0");
      expect(remainingResource.rows[0]?.count).toBe("0");
      expect(freshAccountNotifications.rows[0]?.count).toBe("1");
    } finally {
      await checkClient.end();
    }
  });
});
