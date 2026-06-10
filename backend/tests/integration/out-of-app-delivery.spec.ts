import { Client } from "pg";

import {
  TEST_DATABASE_URL,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedNeed } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";
import { waitForResult } from "./test-async-helpers";
import { issueNotificationDigestsTask } from "../../src/worker/tasks/issue-notification-digests";
import { deliverAuthEmailsTask } from "../../src/worker/tasks/deliver-auth-emails";
import { deliverPushNotificationsTask } from "../../src/worker/tasks/deliver-push-notifications";

jest.setTimeout(30000);

async function withDbClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function setPreferredLanguage(accountId: string, language: "en" | "fr") {
  await withDbClient(client => client.query(
    "update app_public.account set preferred_language = $2::text where id = $1::uuid",
    [accountId, language]
  ));
}

async function setDeliveryPreference(
  accountId: string,
  eventCategory: string,
  deliveryStrategy: "realtime_push" | "email_summary",
  summaryFrequencyDays: 1 | 3 | 7 | 30
) {
  await withDbClient(client => client.query(
    `
      insert into app_public.account_delivery_preference (
        account_id,
        event_category,
        delivery_strategy,
        summary_frequency_days
      )
      values ($1::uuid, $2::text, $3::text, $4::integer)
      on conflict (account_id, event_category)
      do update set
        delivery_strategy = excluded.delivery_strategy,
        summary_frequency_days = excluded.summary_frequency_days,
        updated_at = now()
    `,
    [accountId, eventCategory, deliveryStrategy, summaryFrequencyDays]
  ));
}

async function dispatchPreferenceManagedEvent(
  accountId: string,
  eventCategory: string,
  title: string,
  body: string,
  payload: Record<string, unknown>
) {
  await withDbClient(client => client.query(
    `
      select app_private.dispatch_preference_managed_event(
        $1::uuid,
        $2::text,
        $3::text,
        $4::text,
        $5::jsonb
      )
    `,
    [accountId, eventCategory, title, body, payload]
  ));
}

async function createActiveSession(accountId: string, roleName = "identified_account") {
  await withDbClient(client => client.query(
    `
      insert into app_private.account_session (
        account_id,
        role_name,
        session_token_hash,
        expires_at
      )
      values (
        $1::uuid,
        $2::text,
        $3::text,
        now() + interval '1 day'
      )
    `,
    [accountId, roleName, `test-session-${accountId}-${Date.now()}-${Math.random().toString(16).slice(2)}`]
  ));
}

async function getDigestMailCount(accountId: string) {
  return withDbClient(async client => {
    const result = await client.query<{ count: string }>(
      `
        select count(*)::text as count
        from app_private.mail_outbox
        where account_id = $1::uuid
          and mail_kind = 'notification_digest'
      `,
      [accountId]
    );

    return Number(result.rows[0]?.count ?? "0");
  });
}

async function getLatestDigestMail(accountId: string) {
  return withDbClient(async client => {
    const result = await client.query<{
      id: string;
      status: string;
      text_body: string | null;
    }>(
      `
        select id::text, status::text, text_body
        from app_private.mail_outbox
        where account_id = $1::uuid
          and mail_kind = 'notification_digest'
        order by created_at desc
        limit 1
      `,
      [accountId]
    );

    return result.rows[0];
  });
}

async function getDeliveryCounts(accountId: string, eventCategory: string) {
  return withDbClient(async client => {
    const result = await client.query<{
      push_count: string;
      digest_count: string;
      unbroadcasted_digest_count: string;
    }>(
      `
        select
          (
            select count(*)::text
            from app_private.push_notification_outbox
            where account_id = $1::uuid
              and event_category = $2::text
          ) as push_count,
          (
            select count(*)::text
            from app_private.delivery_digest_item
            where account_id = $1::uuid
              and event_category = $2::text
          ) as digest_count,
          (
            select count(*)::text
            from app_private.delivery_digest_item
            where account_id = $1::uuid
              and event_category = $2::text
              and broadcasted_at is null
          ) as unbroadcasted_digest_count
      `,
      [accountId, eventCategory]
    );

    return {
      pushCount: Number(result.rows[0]?.push_count ?? "0"),
      digestCount: Number(result.rows[0]?.digest_count ?? "0"),
      unbroadcastedDigestCount: Number(result.rows[0]?.unbroadcasted_digest_count ?? "0")
    };
  });
}

describe("out-of-app delivery integration", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalMailEnabled = process.env.MAIL_DELIVERY_ENABLED;
  const originalPushEnabled = process.env.PUSH_DELIVERY_ENABLED;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.MAIL_DELIVERY_ENABLED = "false";
    process.env.PUSH_DELIVERY_ENABLED = "false";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.MAIL_DELIVERY_ENABLED = originalMailEnabled;
    process.env.PUSH_DELIVERY_ENABLED = originalPushEnabled;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("delivers a summary email only once the 3-day cadence is due", async () => {
    const stamp = Date.now();
    const recipient = await seedDemoAccount({
      identifier: `digest-3day-${stamp}@example.com`,
      displayName: "Digest Recipient"
    });
    await setPreferredLanguage(recipient.accountId, "en");

    await setDeliveryPreference(recipient.accountId, "new_need_added", "email_summary", 3);
    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "new_need_added",
      `New need ${stamp}`,
      "A neighbour needs help carrying groceries.",
      { stamp }
    );

    await issueNotificationDigestsTask({ nowIso: new Date(stamp + 2 * 24 * 60 * 60 * 1000).toISOString() }, {} as never);

    const beforeDueCount = await getDigestMailCount(recipient.accountId);

    expect(beforeDueCount).toBe(0);

    await issueNotificationDigestsTask({ nowIso: new Date(stamp + 4 * 24 * 60 * 60 * 1000).toISOString() }, {} as never);

    const queuedDigest = await getLatestDigestMail(recipient.accountId);

    expect(queuedDigest?.id).toBeTruthy();

    await deliverAuthEmailsTask({ mailId: queuedDigest?.id }, {} as never);

    const digestMail = await getLatestDigestMail(recipient.accountId);

    expect(digestMail?.status).toBe("skipped");
    expect(digestMail?.text_body).toContain(`New need ${stamp}`);

    await issueNotificationDigestsTask({ nowIso: new Date(stamp + 6 * 24 * 60 * 60 * 1000).toISOString() }, {} as never);

    const afterBroadcastDigestCount = await getDigestMailCount(recipient.accountId);
    const postBroadcastDeliveryCounts = await getDeliveryCounts(recipient.accountId, "new_need_added");

    expect(afterBroadcastDigestCount).toBe(1);
    expect(postBroadcastDeliveryCounts.unbroadcastedDigestCount).toBe(0);
  });

  it.each([
    [1, 12 * 60 * 60 * 1000, 2 * 24 * 60 * 60 * 1000],
    [7, 6 * 24 * 60 * 60 * 1000, 8 * 24 * 60 * 60 * 1000],
    [30, 29 * 24 * 60 * 60 * 1000, 31 * 24 * 60 * 60 * 1000]
  ])("respects the %i-day digest cadence window", async (summaryFrequencyDays, beforeOffsetMs, afterOffsetMs) => {
    const stamp = Date.now();
    const recipient = await seedDemoAccount({
      identifier: `digest-${summaryFrequencyDays}day-${stamp}@example.com`,
      displayName: `Digest ${summaryFrequencyDays}-day Recipient`
    });
    await setPreferredLanguage(recipient.accountId, "en");

    await setDeliveryPreference(recipient.accountId, "unread_notifications", "email_summary", summaryFrequencyDays as 1 | 3 | 7 | 30);
    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "unread_notifications",
      `Digest notification ${summaryFrequencyDays}-${stamp}`,
      "A queued unread notification is awaiting the next cadence window.",
      { stamp, summaryFrequencyDays }
    );

    await issueNotificationDigestsTask({ nowIso: new Date(stamp + beforeOffsetMs).toISOString() }, {} as never);
    expect(await getDigestMailCount(recipient.accountId)).toBe(0);

    await issueNotificationDigestsTask({ nowIso: new Date(stamp + afterOffsetMs).toISOString() }, {} as never);
    expect(await getDigestMailCount(recipient.accountId)).toBe(1);
  });

  it("routes each managed category to exactly one out-of-app path and suppresses both paths when an account is active", async () => {
    const stamp = Date.now();
    const managedCategories = [
      "new_resource_added",
      "new_need_added",
      "unread_notifications",
      "new_chat_message_received"
    ] as const;

    const realtimeRecipient = await seedDemoAccount({
      identifier: `realtime-matrix-${stamp}@example.com`,
      displayName: "Realtime Matrix Recipient"
    });
    await setPreferredLanguage(realtimeRecipient.accountId, "en");

    for (const category of managedCategories) {
      await setDeliveryPreference(realtimeRecipient.accountId, category, "realtime_push", 1);
      await dispatchPreferenceManagedEvent(
        realtimeRecipient.accountId,
        category,
        `${category}-push-${stamp}`,
        `Push body for ${category}`,
        { stamp, category, strategy: "realtime_push" }
      );

      const counts = await getDeliveryCounts(realtimeRecipient.accountId, category);
      expect(counts.pushCount).toBe(1);
      expect(counts.digestCount).toBe(0);
    }

    const digestRecipient = await seedDemoAccount({
      identifier: `digest-matrix-${stamp}@example.com`,
      displayName: "Digest Matrix Recipient"
    });
    await setPreferredLanguage(digestRecipient.accountId, "en");

    for (const category of managedCategories) {
      await setDeliveryPreference(digestRecipient.accountId, category, "email_summary", 1);
      await dispatchPreferenceManagedEvent(
        digestRecipient.accountId,
        category,
        `${category}-digest-${stamp}`,
        `Digest body for ${category}`,
        { stamp, category, strategy: "email_summary" }
      );

      const counts = await getDeliveryCounts(digestRecipient.accountId, category);
      expect(counts.pushCount).toBe(0);
      expect(counts.digestCount).toBe(1);
    }

    const activeRecipient = await seedDemoAccount({
      identifier: `active-gate-${stamp}@example.com`,
      displayName: "Active Gate Recipient"
    });
    await setPreferredLanguage(activeRecipient.accountId, "en");
    await createActiveSession(activeRecipient.accountId);

    for (const [index, category] of managedCategories.entries()) {
      await setDeliveryPreference(
        activeRecipient.accountId,
        category,
        index % 2 === 0 ? "realtime_push" : "email_summary",
        1
      );
      await dispatchPreferenceManagedEvent(
        activeRecipient.accountId,
        category,
        `${category}-active-${stamp}`,
        `Suppressed body for ${category}`,
        { stamp, category, strategy: index % 2 === 0 ? "realtime_push" : "email_summary" }
      );

      const counts = await getDeliveryCounts(activeRecipient.accountId, category);
      expect(counts.pushCount).toBe(0);
      expect(counts.digestCount).toBe(0);
    }
  });

  it("queues and processes a push notification when a new resource is created for a realtime-push recipient", async () => {
    const stamp = `${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `push-creator-${stamp}@example.com`,
      displayName: "Push Creator"
    });
    const recipient = await seedDemoAccount({
      identifier: `push-recipient-${stamp}@example.com`,
      displayName: "Push Recipient"
    });
    await setPreferredLanguage(recipient.accountId, "en");

    await withDbClient(async client => {
      await client.query(
        "update app_public.account set latitude = 50.6072, longitude = 3.3889 where id = $1::uuid",
        [recipient.accountId]
      );
    });

    await seedNeed({
      creatorAccount: recipient,
      title: `Matching need ${stamp}`,
      location: "Tournai centre",
      latitude: 50.6072,
      longitude: 3.3889,
      intensity: "sharing",
      objectRequired: true
    });

    await setDeliveryPreference(recipient.accountId, "new_resource_added", "realtime_push", 1);

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Push-targeted resource ${stamp}`,
      location: "Tournai centre",
      latitude: 50.6072,
      longitude: 3.3889,
      intensity: "sharing",
      defaultTokenAmount: 150,
      isProduct: true,
      isService: false,
      canBeGiven: true,
      canBeExchanged: true,
      canBeTakenAway: true,
      canBeDelivered: false,
      categoryCodes: [3]
    });

    expect(resource.id).toBeTruthy();

    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "new_resource_added",
      "New resource added near you",
      `Push-targeted resource ${stamp}`,
      { resource_id: resource.id, stamp }
    );

    const pushRowBeforeDelivery = await waitForResult(async () => {
      return withDbClient(async client => {
        const result = await client.query<{
          id: string;
          status: string;
          title: string;
          body: string;
        }>(
          `
            select id, status::text, title, body
            from app_private.push_notification_outbox
            where account_id = $1::uuid
              and event_category = 'new_resource_added'
              and metadata ->> 'resource_id' = $2::text
            order by created_at desc
            limit 1
          `,
          [recipient.accountId, resource.id]
        );

        return result.rows[0];
      });
    }, { timeoutMs: 15000, pollMs: 250 });

    expect(pushRowBeforeDelivery?.id).toBeTruthy();

    await deliverPushNotificationsTask({ notificationId: pushRowBeforeDelivery?.id }, {} as never);

    const pushRow = await withDbClient(async client => {
      const result = await client.query<{
        status: string;
        title: string;
        body: string;
      }>(
        `
          select status::text, title, body
          from app_private.push_notification_outbox
          where id = $1::uuid
        `,
        [pushRowBeforeDelivery?.id]
      );

      return result.rows[0];
    });

    expect(pushRow?.status).toBe("skipped");
    expect(pushRow?.title).toBe("New resource added near you");
    expect(pushRow?.body).toContain(`Push-targeted resource ${stamp}`);
  });

  it("delivers one summary email containing resource, notification, need, and chat message items", async () => {
    const stamp = Date.now();
    const recipient = await seedDemoAccount({
      identifier: `digest-mixed-${stamp}@example.com`,
      displayName: "Digest Mixed Recipient"
    });
    await setPreferredLanguage(recipient.accountId, "en");

    for (const category of [
      "new_resource_added",
      "new_need_added",
      "unread_notifications",
      "new_chat_message_received"
    ]) {
      await setDeliveryPreference(recipient.accountId, category, "email_summary", 1);
    }

    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "new_resource_added",
      `Resource ${stamp}`,
      "Fresh vegetables available nearby.",
      { stamp, kind: "resource" }
    );
    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "unread_notifications",
      `Notification ${stamp}`,
      "You have one unread in-app notification.",
      { stamp, kind: "notification" }
    );
    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "new_need_added",
      `Need ${stamp}`,
      "Someone nearby needs a bicycle pump.",
      { stamp, kind: "need" }
    );
    await dispatchPreferenceManagedEvent(
      recipient.accountId,
      "new_chat_message_received",
      `Chat ${stamp}`,
      "You have one unread chat message.",
      { stamp, kind: "chat" }
    );

    await issueNotificationDigestsTask({ nowIso: new Date(stamp + 2 * 24 * 60 * 60 * 1000).toISOString() }, {} as never);

    const queuedDigest = await getLatestDigestMail(recipient.accountId);

    expect(queuedDigest?.id).toBeTruthy();

    await deliverAuthEmailsTask({ mailId: queuedDigest?.id }, {} as never);

    const digestMail = await getLatestDigestMail(recipient.accountId);

    expect(digestMail?.status).toBe("skipped");
    expect(digestMail?.text_body).toContain("New resources:");
    expect(digestMail?.text_body).toContain(`Resource ${stamp}`);
    expect(digestMail?.text_body).toContain("Unread notifications:");
    expect(digestMail?.text_body).toContain(`Notification ${stamp}`);
    expect(digestMail?.text_body).toContain("New needs:");
    expect(digestMail?.text_body).toContain(`Need ${stamp}`);
    expect(digestMail?.text_body).toContain("Unread chat messages:");
    expect(digestMail?.text_body).toContain(`Chat ${stamp}`);
  });
});