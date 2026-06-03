import { createHmac, timingSafeEqual } from "node:crypto";

const SOCIAL_STATE_TTL_SECONDS = 10 * 60;

type SignSocialAuthStateInput = {
  next: string;
  link?: boolean;
  nonce?: string;
  issuedAt?: number;
};

export type SocialAuthStatePayload = {
  next: string;
  link?: boolean;
  nonce?: string;
  issuedAt: number;
  expiresAt: number;
};

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(`${base64}${padding}`, "base64");
}

function signPayload(payloadBase64Url: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(payloadBase64Url).digest());
}

function isSignatureValid(payloadBase64Url: string, signatureBase64Url: string, secret: string) {
  const expected = Buffer.from(signPayload(payloadBase64Url, secret));
  const received = Buffer.from(signatureBase64Url);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function signSocialAuthState(input: SignSocialAuthStateInput, secret: string) {
  if (!secret) {
    throw new Error("Missing SOCIAL_AUTH_STATE_SECRET");
  }

  const issuedAt = input.issuedAt ?? Math.floor(Date.now() / 1000);
  const payload: SocialAuthStatePayload = {
    next: input.next,
    issuedAt,
    expiresAt: issuedAt + SOCIAL_STATE_TTL_SECONDS
  };

  if (input.link) {
    payload.link = true;
  }

  if (input.nonce) {
    payload.nonce = input.nonce;
  }

  const payloadBase64Url = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64Url, secret);

  return `${payloadBase64Url}.${signature}`;
}

export function verifySocialAuthState(state: string, secret: string) {
  if (!state || !secret) {
    return null;
  }

  const parts = state.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64Url, signatureBase64Url] = parts;
  if (!payloadBase64Url || !signatureBase64Url) {
    return null;
  }

  if (!isSignatureValid(payloadBase64Url, signatureBase64Url, secret)) {
    return null;
  }

  let payload: SocialAuthStatePayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadBase64Url).toString("utf8")) as SocialAuthStatePayload;
  } catch {
    return null;
  }

  if (typeof payload.next !== "string" || !payload.next.startsWith("/")) {
    return null;
  }

  if (typeof payload.issuedAt !== "number" || typeof payload.expiresAt !== "number") {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.expiresAt < now) {
    return null;
  }

  return payload;
}
