import { createHash, randomBytes } from "node:crypto";

import type { CookieOptions, RequestHandler } from "express";
import type { Pool } from "pg";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "mutuity_session";
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 168);
const FIND_ACCOUNT_SESSION_SQL = "select * from app_private.find_account_session($1);";
const TOUCH_ACCOUNT_SESSION_SQL = "select app_private.touch_account_session($1);";
const INSERT_ACCOUNT_SESSION_SQL =
  "select app_private.create_account_session($1, $2, $3, $4) as id;";
const REVOKE_ACCOUNT_SESSION_SQL = "select app_private.revoke_account_session($1);";

export type AuthenticatedSession = {
  sessionId: string;
  accountId: string;
  role: string;
  displayName: string | null;
  externalSubject: string;
  avatarUrl: string | null;
  expiresAt: string;
};

type SessionRow = {
  session_id: string;
  account_id: string;
  role_name: string;
  expires_at: Date;
  display_name: string | null;
  external_subject: string;
  avatar_url: string | null;
};

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthenticatedSession | null;
    }
  }
}

function hashSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}

function toAuthenticatedSession(row: SessionRow): AuthenticatedSession {
  return {
    sessionId: row.session_id,
    accountId: row.account_id,
    role: row.role_name,
    displayName: row.display_name,
    externalSubject: row.external_subject,
    avatarUrl: row.avatar_url,
    expiresAt: row.expires_at.toISOString()
  };
}

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 60 * 60 * 1000
  };
}

export function getSessionTokenFromRequest(req: {
  signedCookies?: Record<string, string | undefined>;
  cookies?: Record<string, string | undefined>;
}) {
  return req.signedCookies?.[SESSION_COOKIE_NAME] ?? req.cookies?.[SESSION_COOKIE_NAME] ?? null;
}

export async function getSessionFromToken(pool: Pool, sessionToken: string) {
  const sessionTokenHash = hashSessionToken(sessionToken);
  const { rows } = await pool.query<SessionRow>(FIND_ACCOUNT_SESSION_SQL, [sessionTokenHash]);

  const row = rows[0];

  if (!row) {
    return null;
  }

  await pool.query(TOUCH_ACCOUNT_SESSION_SQL, [sessionTokenHash]);

  return toAuthenticatedSession(row);
}

export async function createSessionForAccount(
  pool: Pool,
  input: {
    accountId: string;
    role: string;
  }
) {
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const { rows } = await pool.query<{ id: string }>(INSERT_ACCOUNT_SESSION_SQL, [
    input.accountId,
    input.role,
    hashSessionToken(sessionToken),
    expiresAt
  ]);

  return {
    sessionId: rows[0]?.id ?? sessionToken,
    sessionToken,
    expiresAt: expiresAt.toISOString()
  };
}

export async function revokeSessionByToken(pool: Pool, sessionToken: string) {
  await pool.query(REVOKE_ACCOUNT_SESSION_SQL, [hashSessionToken(sessionToken)]);
}

export function createAuthSessionMiddleware(pool: Pool): RequestHandler {
  return async (req, _res, next) => {
    try {
      const sessionToken = getSessionTokenFromRequest(req);
      req.authSession = sessionToken ? await getSessionFromToken(pool, sessionToken) : null;
    } catch (error) {
      console.error("[auth] Failed to resolve request session", error);
      req.authSession = null;
    }

    next();
  };
}
