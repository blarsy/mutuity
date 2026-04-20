import FormData from "form-data";
import Mailgun from "mailgun.js";

export type OutboundMail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function isTruthyEnv(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isMailDeliveryEnabled() {
  if (typeof process.env.MAIL_DELIVERY_ENABLED === "string") {
    return isTruthyEnv(process.env.MAIL_DELIVERY_ENABLED);
  }

  return false;
}

function readMailgunConfig() {
  return {
    apiKey: process.env.MAILGUN_API_KEY,
    apiUrl: process.env.MAILGUN_API_URL,
    domain: process.env.MAILGUN_DOMAIN
  };
}

export async function sendViaMailgun(mail: OutboundMail) {
  const config = readMailgunConfig();

  if (!config.apiKey) {
    throw new Error("Missing MAILGUN_API_KEY.");
  }

  if (!config.domain) {
    throw new Error("Missing MAILGUN_DOMAIN.");
  }

  const mailgun = new Mailgun(FormData);
  const client = mailgun.client({
    username: "api",
    key: config.apiKey,
    url: config.apiUrl
  });

  return client.messages.create(config.domain, {
    from: mail.from,
    to: [mail.to],
    subject: mail.subject,
    text: mail.text,
    html: mail.html
  });
}
