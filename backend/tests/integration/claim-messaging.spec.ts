import { TEST_BACKEND_URL, loginWithGraphqlSessionCookie, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";

jest.setTimeout(30000);

describe("claim messaging integration", () => {
  it("creates the conversation on the creator's first reply, persists image metadata, and limits access to participants", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `msg-creator-${stamp}@example.com`,
      displayName: "Message Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `msg-claimer-${stamp}@example.com`,
      displayName: "Message Claimer"
    });
    const outsider = await seedDemoAccount({
      identifier: `msg-outsider-${stamp}@example.com`,
      displayName: "Message Outsider"
    });
    const need = await seedNeed({
      creatorAccount: creator,
      title: `US4 Claim ${stamp}`,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "Initial claimer note"
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const sendResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          mutation SendClaimMessage($input: SendClaimMessageInput!) {
            sendClaimMessage(input: $input) {
              claimMessage {
                id
                conversationId
                senderAccountId
                body
                readAt
                claimMessageImagesByMessageId {
                  nodes {
                    imageUrl
                    sortOrder
                  }
                }
              }
            }
          }
        `,
        variables: {
          input: {
            needClaimId: claim.id,
            body: "Happy to coordinate. Let's do this.",
            imageUrls: ["https://example.com/plan.png"],
            clientMutationId: "send-first-reply"
          }
        }
      })
    });

    expect(sendResponse.status).toBe(200);
    const sendPayload = (await sendResponse.json()) as {
      data?: {
        sendClaimMessage: {
          claimMessage: {
            id: string;
            conversationId: string;
            senderAccountId: string;
            body: string;
            claimMessageImagesByMessageId: {
              nodes: Array<{ imageUrl: string; sortOrder: number }>;
            };
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(sendPayload.errors).toBeUndefined();
    expect(sendPayload.data?.sendClaimMessage.claimMessage).toMatchObject({
      senderAccountId: creator.accountId,
      body: "Happy to coordinate. Let's do this."
    });
    expect(sendPayload.data?.sendClaimMessage.claimMessage.claimMessageImagesByMessageId.nodes).toEqual([
      expect.objectContaining({ imageUrl: "https://example.com/plan.png", sortOrder: 0 })
    ]);

    const claimerCookie = await loginWithGraphqlSessionCookie(claimer.identifier, claimer.password);

    const conversationResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerCookie
      },
      body: JSON.stringify({
        query: `
          query ClaimConversation($needClaimId: UUID!) {
            allClaimConversations(condition: { needClaimId: $needClaimId }, first: 1) {
              nodes {
                id
                needClaimId
                creatorAccountId
                claimerAccountId
                claimMessagesByConversationId {
                  nodes {
                    id
                    senderAccountId
                    body
                    createdAt
                    readAt
                    claimMessageImagesByMessageId {
                      nodes {
                        imageUrl
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          needClaimId: claim.id
        }
      })
    });

    expect(conversationResponse.status).toBe(200);
    const conversationPayload = (await conversationResponse.json()) as {
      data?: {
        allClaimConversations: {
          nodes: Array<{
            id: string;
            creatorAccountId: string;
            claimerAccountId: string;
            claimMessagesByConversationId: {
              nodes: Array<{
                senderAccountId: string;
                body: string;
                createdAt: string;
                readAt: string | null;
                claimMessageImagesByMessageId: { nodes: Array<{ imageUrl: string }> };
              }>;
            };
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    const conversation = conversationPayload.data?.allClaimConversations.nodes[0] ?? null;

    expect(conversationPayload.errors).toBeUndefined();
    expect(conversation).toMatchObject({
      creatorAccountId: creator.accountId,
      claimerAccountId: claimer.accountId
    });

    const orderedMessages = [
      ...(conversation?.claimMessagesByConversationId.nodes ?? [])
    ].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );

    expect(orderedMessages).toEqual([
      expect.objectContaining({
        senderAccountId: claimer.accountId,
        body: "Initial claimer note"
      }),
      expect.objectContaining({
        senderAccountId: creator.accountId,
        body: "Happy to coordinate. Let's do this.",
        claimMessageImagesByMessageId: {
          nodes: [expect.objectContaining({ imageUrl: "https://example.com/plan.png" })]
        }
      })
    ]);

    const conversationId = conversation?.id;
    expect(conversationId).toBeTruthy();

    const markReadResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerCookie
      },
      body: JSON.stringify({
        query: `
          mutation MarkClaimMessagesRead($input: MarkClaimMessagesReadInput!) {
            markClaimMessagesRead(input: $input) {
              integer
            }
          }
        `,
        variables: {
          input: {
            conversationId
          }
        }
      })
    });

    expect(markReadResponse.status).toBe(200);
    await expect(markReadResponse.json()).resolves.toMatchObject({
      data: {
        markClaimMessagesRead: {
          integer: 1
        }
      }
    });

    const outsiderCookie = await loginWithGraphqlSessionCookie(outsider.identifier, outsider.password);

    const outsiderSendResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: outsiderCookie
      },
      body: JSON.stringify({
        query: `
          mutation SendClaimMessage($input: SendClaimMessageInput!) {
            sendClaimMessage(input: $input) {
              claimMessage {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            needClaimId: claim.id,
            body: "I should not be allowed here."
          }
        }
      })
    });

    expect(outsiderSendResponse.status).toBe(200);
    await expect(outsiderSendResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Only claim participants can send messages",
          extensions: {
            code: "FORBIDDEN"
          }
        }
      ]
    });
  });
});
