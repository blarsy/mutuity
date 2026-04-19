import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

describe("token gifting integration", () => {
  it("creates opposite ledger movements and notifies the recipient", async () => {
    const stamp = Date.now();
    const sender = await seedDemoAccount({
      identifier: `gift-sender-${stamp}@example.com`,
      displayName: "Generous Sender"
    });
    const recipient = await seedDemoAccount({
      identifier: `gift-recipient-${stamp}@example.com`,
      displayName: "Thankful Recipient"
    });

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();
    await client.query(
      `
        insert into app_public.token_movement (
          account_id,
          event_type,
          amount_delta,
          reference_type,
          payload,
          idempotency_key
        )
        values ($1, 'test_seed_credit', 200, 'test', '{}'::jsonb, $2)
      `,
      [sender.accountId, `seed-credit-${stamp}`]
    );
    await client.end();

    const senderCookie = await loginWithGraphqlSessionCookie(sender.identifier, sender.password);

    const giftResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: senderCookie
      },
      body: JSON.stringify({
        query: `
          mutation GiftTokens($input: GiftTokensInput!) {
            giftTokens(input: $input) {
              tokenMovement {
                id
                eventType
                amountDelta
                referenceType
                referenceId
              }
            }
          }
        `,
        variables: {
          input: {
            recipientAccountId: recipient.accountId,
            amount: 75,
            message: "Thanks for helping yesterday"
          }
        }
      })
    });

    expect(giftResponse.status).toBe(200);
    await expect(giftResponse.json()).resolves.toMatchObject({
      data: {
        giftTokens: {
          tokenMovement: {
            eventType: "gift_tokens_sent",
            amountDelta: -75,
            referenceType: "gift_transfer"
          }
        }
      }
    });

    const senderLedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: senderCookie
      },
      body: JSON.stringify({
        query: `
          query SenderLedger {
            currentTokenBalance
            allTokenMovements(first: 20) {
              nodes {
                eventType
                amountDelta
                counterpartyAccountId
                referenceType
              }
            }
          }
        `
      })
    });

    expect(senderLedgerResponse.status).toBe(200);
    await expect(senderLedgerResponse.json()).resolves.toMatchObject({
      data: {
        currentTokenBalance: 125,
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "gift_tokens_sent",
              amountDelta: -75,
              counterpartyAccountId: recipient.accountId,
              referenceType: "gift_transfer"
            })
          ])
        }
      }
    });

    const recipientCookie = await loginWithGraphqlSessionCookie(recipient.identifier, recipient.password);

    const recipientOverviewResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: recipientCookie
      },
      body: JSON.stringify({
        query: `
          query RecipientOverview {
            currentTokenBalance
            allTokenMovements(first: 20) {
              nodes {
                eventType
                amountDelta
                counterpartyAccountId
                referenceType
              }
            }
            allAccountNotifications(first: 20) {
              nodes {
                eventType
                payload
                readAt
              }
            }
          }
        `
      })
    });

    expect(recipientOverviewResponse.status).toBe(200);
    await expect(recipientOverviewResponse.json()).resolves.toMatchObject({
      data: {
        currentTokenBalance: 75,
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "gift_tokens_received",
              amountDelta: 75,
              counterpartyAccountId: sender.accountId,
              referenceType: "gift_transfer"
            })
          ])
        },
        allAccountNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "gift_tokens_received",
              payload: expect.objectContaining({
                senderAccountId: sender.accountId,
                senderName: sender.displayName,
                amountReceived: 75,
                message: "Thanks for helping yesterday"
              }),
              readAt: null
            })
          ])
        }
      }
    });
  });
});
