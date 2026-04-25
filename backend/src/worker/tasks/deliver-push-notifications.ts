import type { Task } from "graphile-worker";
import { Client } from "pg";

import { isPushDeliveryEnabled, sendLivePushNotification } from "../../push/index.js";

type DeliverPushNotificationsPayload = {
  notificationId?: string;
};

type PendingPushNotification = {
  id: string;
  account_id: string;
  event_category: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
};

function readPushTarget(metadata: Record<string, unknown> | null) {
  const value = metadata?.expoPushToken;

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return null;
}

const CLAIM_PENDING_PUSH_NOTIFICATIONS_SQL =
  "select * from app_private.claim_pending_push_notification_outbox($1::uuid, $2::integer);";

const MARK_PUSH_SENT_SQL =
  "select app_private.mark_push_notification_outbox_sent($1::uuid, $2::text);";

const MARK_PUSH_SKIPPED_SQL =
  "select app_private.mark_push_notification_outbox_skipped($1::uuid, $2::text);";

const MARK_PUSH_FAILED_SQL =
  "select app_private.mark_push_notification_outbox_failed($1::uuid, $2::text);";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Unknown error";
}

async function lockPendingPushNotifications(client: Client, payload: DeliverPushNotificationsPayload) {
  const requestedNotificationId = payload.notificationId?.trim() || null;
  const batchSize = Math.max(1, Number(process.env.PUSH_DELIVERY_BATCH_SIZE ?? 25));

  const result = await client.query<PendingPushNotification>(CLAIM_PENDING_PUSH_NOTIFICATIONS_SQL, [
    requestedNotificationId,
    batchSize
  ]);
  return result.rows;
}

export const deliverPushNotificationsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as DeliverPushNotificationsPayload;
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const notifications = await lockPendingPushNotifications(client, typedPayload);

    if (notifications.length === 0) {
      return;
    }

    const deliveryEnabled = isPushDeliveryEnabled();
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const notification of notifications) {
      try {
        if (!deliveryEnabled) {
          await client.query(MARK_PUSH_SKIPPED_SQL, [notification.id, "Push delivery disabled"]);
          skippedCount += 1;
          continue;
        }

        const pushTarget = readPushTarget(notification.metadata);

        if (!pushTarget) {
          await client.query(MARK_PUSH_SKIPPED_SQL, [notification.id, "Missing push target token"]);
          skippedCount += 1;
          continue;
        }

        const providerResponse = await sendLivePushNotification({
          to: pushTarget,
          eventCategory: notification.event_category,
          title: notification.title,
          body: notification.body,
          metadata: notification.metadata ?? {}
        });

        await client.query(MARK_PUSH_SENT_SQL, [
          notification.id,
          typeof providerResponse?.id === "string" ? providerResponse.id : null
        ]);
        sentCount += 1;
      } catch (error) {
        await client.query(MARK_PUSH_FAILED_SQL, [notification.id, toErrorMessage(error)]);
        failedCount += 1;
      }
    }

    console.log(
      `[worker] deliver_push_notification_outbox processed=${notifications.length} sent=${sentCount} skipped=${skippedCount} failed=${failedCount}`
    );
  } finally {
    await client.end();
  }
};