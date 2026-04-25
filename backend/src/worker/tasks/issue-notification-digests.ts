import type { Task } from "graphile-worker";
import { Client } from "pg";

import { logWorkerError, logWorkerInfo } from "../../logging/operationalLogger.js";

type IssueNotificationDigestsPayload = {
  nowIso?: string;
};

type DigestItemPayload = {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

type PendingDigestItem = {
  id: string;
  event_category: string;
  payload: DigestItemPayload | null;
  created_at: string;
};

type PendingDigestAccount = {
  account_id: string;
  recipient_email: string;
  locale: string;
  item_ids: string[] | string;
  items: PendingDigestItem[] | string | null;
};

const GET_PENDING_DIGEST_ACCOUNTS_SQL =
  "select * from app_private.get_pending_delivery_digest_accounts($1::timestamptz, $2::integer);";

const HAS_PENDING_DIGEST_MAIL_SQL = `
  select exists (
    select 1
    from app_private.mail_outbox mo
    where mo.account_id = $1
      and mo.mail_kind = 'notification_digest'
      and mo.status in ('pending', 'processing')
  ) as has_pending
`;

const INSERT_DIGEST_MAIL_SQL = `
  insert into app_private.mail_outbox (
    account_id,
    recipient_email,
    mail_kind,
    metadata,
    status,
    subject,
    text_body,
    html_body,
    locale
  )
  values (
    $1::uuid,
    lower($2::text),
    'notification_digest',
    $3::jsonb,
    'pending',
    $4::text,
    $5::text,
    $6::text,
    $7::text
  )
  returning id
`;

function normalizeStringArray(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();

  if (trimmed.length < 2 || trimmed[0] !== "{" || trimmed[trimmed.length - 1] !== "}") {
    return [];
  }

  return trimmed.slice(1, -1).split(",").map(entry => entry.replace(/^"|"$/g, "")).filter(Boolean);
}

function normalizeDigestItems(value: PendingDigestItem[] | string | null): PendingDigestItem[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as PendingDigestItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sectionTitle(category: string, locale: string) {
  const isFrench = locale === "fr";

  switch (category) {
    case "new_resource_added":
      return isFrench ? "Nouvelles ressources" : "New resources";
    case "new_need_added":
      return isFrench ? "Nouveaux besoins" : "New needs";
    case "unread_notifications":
      return isFrench ? "Notifications non lues" : "Unread notifications";
    case "new_chat_message_received":
      return isFrench ? "Messages de chat non lus" : "Unread chat messages";
    default:
      return category;
  }
}

function buildDigestContent(locale: string, items: PendingDigestItem[]) {
  const grouped = new Map<string, PendingDigestItem[]>();

  for (const item of items) {
    const bucket = grouped.get(item.event_category) ?? [];
    bucket.push(item);
    grouped.set(item.event_category, bucket);
  }

  const intro = locale === "fr"
    ? "Voici votre résumé Mutuity des nouvelles informations en attente."
    : "Here is your Mutuity summary of pending new information.";
  const subject = locale === "fr" ? "Votre résumé Mutuity" : "Your Mutuity summary";
  const textLines = [subject, "", intro, ""];
  const htmlSections = [`<p>${intro}</p>`];

  for (const [category, categoryItems] of grouped.entries()) {
    const heading = sectionTitle(category, locale);
    textLines.push(`${heading}:`);

    const htmlItems: string[] = [];

    for (const item of categoryItems) {
      const title = item.payload?.title?.trim() || heading;
      const body = item.payload?.body?.trim() || "";
      textLines.push(body ? `- ${title}: ${body}` : `- ${title}`);
      htmlItems.push(`<li><strong>${title}</strong>${body ? `: ${body}` : ""}</li>`);
    }

    textLines.push("");
    htmlSections.push(`<section><h2>${heading}</h2><ul>${htmlItems.join("")}</ul></section>`);
  }

  return {
    subject,
    text: textLines.join("\n").trim(),
    html: htmlSections.join("")
  };
}

export const issueNotificationDigestsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as IssueNotificationDigestsPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const batchSize = Math.max(1, Number(process.env.NOTIFICATION_DIGEST_BATCH_SIZE ?? 100));
    const result = await client.query<PendingDigestAccount>(GET_PENDING_DIGEST_ACCOUNTS_SQL, [
      now.toISOString(),
      batchSize
    ]);

    let queuedCount = 0;
    let skippedCount = 0;

    for (const account of result.rows) {
      const hasPendingDigestResult = await client.query<{ has_pending: boolean }>(HAS_PENDING_DIGEST_MAIL_SQL, [
        account.account_id
      ]);

      if (hasPendingDigestResult.rows[0]?.has_pending) {
        skippedCount += 1;
        continue;
      }

      const itemIds = normalizeStringArray(account.item_ids);
      const items = normalizeDigestItems(account.items);

      if (itemIds.length === 0 || items.length === 0) {
        skippedCount += 1;
        continue;
      }

      const content = buildDigestContent(account.locale, items);
      await client.query(INSERT_DIGEST_MAIL_SQL, [
        account.account_id,
        account.recipient_email,
        {
          digest_item_ids: itemIds,
          digest_items: items,
          issued_at: now.toISOString()
        },
        content.subject,
        content.text,
        content.html,
        account.locale
      ]);
      queuedCount += 1;
    }

    await logWorkerInfo(
      `[worker] issue_notification_digests tick at ${now.toISOString()} (accounts=${result.rows.length}, queued=${queuedCount}, skipped=${skippedCount})`,
      {
        task: "issue_notification_digests",
        accounts: result.rows.length,
        queued: queuedCount,
        skipped: skippedCount
      }
    );
  } catch (error) {
    await logWorkerError("[worker] issue_notification_digests task failed", error, {
      task: "issue_notification_digests"
    });
    throw error;
  } finally {
    await client.end();
  }
};