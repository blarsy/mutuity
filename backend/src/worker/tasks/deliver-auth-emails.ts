import type { Task } from "graphile-worker";
import { Client } from "pg";

import { isMailDeliveryEnabled, sendViaMailgun } from "../../mailing/index.js";

type DeliverAuthEmailsPayload = {
  mailId?: string;
};

type TokenKind = "email_verification" | "password_reset";

type SupportedLocale = "en" | "fr";

type PendingAuthEmail = {
  id: string;
  recipient_email: string;
  mail_kind: string;
  auth_token: string | null;
  locale: string | null;
};

type RenderedMailRow = {
  subject: string | null;
  text_body: string | null;
  html_body: string | null;
  metadata: {
    digest_item_ids?: string[] | string;
  } | null;
};

type EmailStrings = {
  subject: string;
  text: string;
  html: string;
};

type LocalizedEmailTemplates = Record<TokenKind, Record<SupportedLocale, (productName: string, link: string) => EmailStrings>>;

const EMAIL_TEMPLATES: LocalizedEmailTemplates = {
  email_verification: {
    en: (productName, link) => ({
      subject: `Verify your email for ${productName}`,
      text: `Welcome to ${productName}. Verify your email by opening this link: ${link}`,
      html: `<p>Welcome to ${productName}.</p><p>Please verify your email by opening this link:</p><p><a href="${link}">${link}</a></p>`
    }),
    fr: (productName, link) => ({
      subject: `Vérifiez votre adresse e-mail pour ${productName}`,
      text: `Bienvenue sur ${productName}. Vérifiez votre adresse e-mail en ouvrant ce lien : ${link}`,
      html: `<p>Bienvenue sur ${productName}.</p><p>Veuillez vérifier votre adresse e-mail en ouvrant ce lien :</p><p><a href="${link}">${link}</a></p>`
    })
  },
  password_reset: {
    en: (productName, link) => ({
      subject: `Reset your ${productName} password`,
      text: `A password reset was requested for your ${productName} account. Set a new password using this link: ${link}`,
      html: `<p>A password reset was requested for your ${productName} account.</p><p>Set a new password using this link:</p><p><a href="${link}">${link}</a></p>`
    }),
    fr: (productName, link) => ({
      subject: `Réinitialisez votre mot de passe ${productName}`,
      text: `Une réinitialisation du mot de passe a été demandée pour votre compte ${productName}. Définissez un nouveau mot de passe via ce lien : ${link}`,
      html: `<p>Une réinitialisation du mot de passe a été demandée pour votre compte ${productName}.</p><p>Définissez un nouveau mot de passe via ce lien :</p><p><a href="${link}">${link}</a></p>`
    })
  }
};

const CLAIM_PENDING_EMAILS_SQL =
  "select * from app_private.claim_pending_mail_outbox($1::uuid, $2::integer);";

const MARK_SENT_SQL =
  "select app_private.mark_mail_outbox_sent($1::uuid, $2::text, $3::text, $4::text, $5::text);";

const MARK_SKIPPED_SQL =
  "select app_private.mark_mail_outbox_skipped($1::uuid, $2::text, $3::text, $4::text);";

const MARK_FAILED_SQL =
  "select app_private.mark_mail_outbox_failed($1::uuid, $2::text, $3::text, $4::text, $5::text);";

const GET_RENDERED_MAIL_SQL = `
  select subject, text_body, html_body, metadata
  from app_private.mail_outbox
  where id = $1::uuid
`;

const MARK_DIGEST_ITEMS_BROADCASTED_SQL =
  "select app_private.mark_delivery_digest_items_broadcasted($1::uuid[], $2::uuid);";

function getFromAddress() {
  return process.env.MAIL_FROM_ADDRESS ?? "Mutuity <noreply@mutuity.local>";
}

function getProductName() {
  return process.env.MAIL_PRODUCT_NAME ?? "Mutuity";
}

function getWebAppBaseUrl() {
  return process.env.MAIL_WEB_APP_URL ?? "http://localhost:3000";
}

function buildAuthEmailContent(email: PendingAuthEmail) {
  const tokenKind: TokenKind =
    email.mail_kind === "auth_email_verification" ? "email_verification" : "password_reset";
  const token = email.auth_token?.trim() ?? "";

  if (token.length === 0) {
    throw new Error(`Missing auth token for outbox message ${email.id}`);
  }

  const route = tokenKind === "email_verification" ? "/verify-email" : "/restore-access";
  const url = new URL(route, getWebAppBaseUrl().endsWith("/") ? getWebAppBaseUrl() : `${getWebAppBaseUrl()}/`);
  url.searchParams.set("token", token);

  const link = url.toString();
  const productName = getProductName();
  const rawLocale = email.locale?.trim().toLowerCase() ?? "en";
  const locale: SupportedLocale = rawLocale === "fr" ? "fr" : "en";
  const { subject, text, html } = EMAIL_TEMPLATES[tokenKind][locale](productName, link);

  return {
    from: getFromAddress(),
    to: email.recipient_email,
    subject,
    text,
    html
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Unknown error";
}

async function lockPendingEmails(client: Client, payload: DeliverAuthEmailsPayload) {
  const requestedMailId = payload.mailId?.trim() || null;
  const batchSize = Math.max(1, Number(process.env.MAIL_DELIVERY_BATCH_SIZE ?? 25));

  const result = await client.query<PendingAuthEmail>(CLAIM_PENDING_EMAILS_SQL, [requestedMailId, batchSize]);
  return result.rows;
}

function normalizeUuidArray(value: string[] | string | undefined) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed.length < 2 || trimmed[0] !== "{" || trimmed[trimmed.length - 1] !== "}") {
    return [];
  }

  return trimmed.slice(1, -1).split(",").map(entry => entry.replace(/^"|"$/g, "")).filter(Boolean);
}

async function getRenderedMailContent(client: Client, emailId: string) {
  const result = await client.query<RenderedMailRow>(GET_RENDERED_MAIL_SQL, [emailId]);
  const row = result.rows[0];

  if (!row?.subject?.trim() || !row?.text_body?.trim() || !row?.html_body?.trim()) {
    throw new Error(`Missing rendered mail body for outbox message ${emailId}`);
  }

  return {
    subject: row.subject,
    text: row.text_body,
    html: row.html_body,
    metadata: row.metadata ?? null
  };
}

async function markDigestItemsBroadcasted(client: Client, emailId: string, metadata: RenderedMailRow["metadata"]) {
  const itemIds = normalizeUuidArray(metadata?.digest_item_ids);

  if (itemIds.length === 0) {
    return;
  }

  await client.query(MARK_DIGEST_ITEMS_BROADCASTED_SQL, [itemIds, emailId]);
}

export const deliverAuthEmailsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as DeliverAuthEmailsPayload;
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const emails = await lockPendingEmails(client, typedPayload);

    if (emails.length === 0) {
      return;
    }

    const deliveryEnabled = isMailDeliveryEnabled();
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const email of emails) {
      let content: ReturnType<typeof buildAuthEmailContent> | null = null;
      let renderedMetadata: RenderedMailRow["metadata"] = null;

      try {
        if (
          email.mail_kind !== "auth_email_verification"
          && email.mail_kind !== "auth_password_reset"
          && email.mail_kind !== "notification_digest"
        ) {
          await client.query(MARK_FAILED_SQL, [
            email.id,
            null,
            null,
            null,
            `Unsupported mail_kind '${email.mail_kind}' for deliver_mail_outbox`
          ]);
          failedCount += 1;
          continue;
        }

        if (email.mail_kind === "notification_digest") {
          const renderedMail = await getRenderedMailContent(client, email.id);
          renderedMetadata = renderedMail.metadata;
          content = {
            from: getFromAddress(),
            to: email.recipient_email,
            subject: renderedMail.subject,
            text: renderedMail.text,
            html: renderedMail.html
          };
        } else {
          content = buildAuthEmailContent(email);
        }

        if (!deliveryEnabled) {
          await client.query(MARK_SKIPPED_SQL, [email.id, content.subject, content.text, content.html]);
          if (email.mail_kind === "notification_digest") {
            await markDigestItemsBroadcasted(client, email.id, renderedMetadata);
          }
          skippedCount += 1;
          continue;
        }

        const providerResponse = await sendViaMailgun(content);
        const providerMessageId =
          typeof providerResponse === "object"
          && providerResponse !== null
          && "id" in providerResponse
          && typeof providerResponse.id === "string"
            ? providerResponse.id
            : null;

        await client.query(MARK_SENT_SQL, [
          email.id,
          content.subject,
          content.text,
          content.html,
          providerMessageId
        ]);
        if (email.mail_kind === "notification_digest") {
          await markDigestItemsBroadcasted(client, email.id, renderedMetadata);
        }
        sentCount += 1;
      } catch (error) {
        await client.query(MARK_FAILED_SQL, [
          email.id,
          content?.subject ?? null,
          content?.text ?? null,
          content?.html ?? null,
          toErrorMessage(error)
        ]);
        failedCount += 1;
      }
    }

    console.log(
      `[worker] deliver_mail_outbox processed=${emails.length} sent=${sentCount} skipped=${skippedCount} failed=${failedCount}`
    );
  } finally {
    await client.end();
  }
};
