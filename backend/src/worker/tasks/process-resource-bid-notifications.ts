import type { Task } from "graphile-worker";
import { Client } from "pg";

type ProcessResourceBidNotificationsPayload = {
  nowIso?: string;
};

type ProcessResourceBidNotificationsResult = {
  expiring_soon_count: number;
  expired_bid_count: number;
  cancelled_bid_count: number;
  refund_count: number;
  notification_count: number;
};

const PROCESS_RESOURCE_BID_NOTIFICATIONS_SQL =
  "select * from app_private.process_resource_bid_notifications($1::timestamptz);";

export const processResourceBidNotificationsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as ProcessResourceBidNotificationsPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<ProcessResourceBidNotificationsResult>(
      PROCESS_RESOURCE_BID_NOTIFICATIONS_SQL,
      [now.toISOString()]
    );
    const counts = result.rows[0] ?? {
      expiring_soon_count: 0,
      expired_bid_count: 0,
      cancelled_bid_count: 0,
      refund_count: 0,
      notification_count: 0
    };

    console.log(
      `[worker] process_resource_bid_notifications tick at ${now.toISOString()} (expiringSoon=${counts.expiring_soon_count}, expired=${counts.expired_bid_count}, cancelled=${counts.cancelled_bid_count}, refunds=${counts.refund_count}, notifications=${counts.notification_count})`
    );
  } finally {
    await client.end();
  }
};
