import express, { Router } from "express";
import type { Pool } from "pg";

import { verifyPassword } from "./credentials.js";
import {
  createSessionForAccount,
  getSessionCookieOptions,
  getSessionTokenFromRequest,
  revokeSessionByToken,
  SESSION_COOKIE_NAME
} from "./session.js";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const INVALID_CREDENTIALS_MESSAGE = "Unable to sign in with those credentials.";
const TOO_MANY_ATTEMPTS_MESSAGE = "Too many sign-in attempts. Please wait a moment and try again.";
const LOGIN_RATE_LIMIT_WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000);
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? 5);
const loginAttemptTracker = new Map<string, number[]>();

type LoginCandidate = {
  account_id: string;
  display_name: string | null;
  external_subject: string;
  password_hash: string;
  role_name: string;
};

function getRateLimitKey(req: express.Request, identifier: string) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0];
  const ip = forwardedIp?.trim() || req.ip || "unknown";
  return `${ip.toLowerCase()}::${identifier.toLowerCase()}`;
}

function isLoginRateLimited(key: string) {
  const now = Date.now();
  const recentAttempts = (loginAttemptTracker.get(key) ?? []).filter(
    timestamp => now - timestamp < LOGIN_RATE_LIMIT_WINDOW_MS
  );

  loginAttemptTracker.set(key, recentAttempts);
  return recentAttempts.length >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
}

function recordFailedLoginAttempt(key: string) {
  const attempts = loginAttemptTracker.get(key) ?? [];
  attempts.push(Date.now());
  loginAttemptTracker.set(key, attempts);
}

function clearFailedLoginAttempts(key: string) {
  loginAttemptTracker.delete(key);
}

function toSessionPayload(req: express.Request) {
  const session = req.authSession ?? null;

  if (!session) {
    return {
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    };
  }

  return {
    authenticated: true,
    account: {
      id: session.accountId,
      displayName: session.displayName,
      externalSubject: session.externalSubject
    },
    role: session.role,
    expiresAt: session.expiresAt
  };
}

export function createAuthRouter(pool: Pool) {
  const router = Router();

  router.use(express.json());

  router.get("/session", (req, res) => {
    res.status(200).json(toSessionPayload(req));
  });

  router.post("/login", async (req, res) => {
    const identifier = String(req.body?.identifier ?? "").trim();
    const password = String(req.body?.password ?? "");
    const rateLimitKey = getRateLimitKey(req, identifier || "anonymous");

    if (isLoginRateLimited(rateLimitKey)) {
      res.status(429).json({ message: TOO_MANY_ATTEMPTS_MESSAGE });
      return;
    }

    if (identifier.length === 0 || password.length === 0) {
      recordFailedLoginAttempt(rateLimitKey);
      res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
      return;
    }

    try {
      const { rows } = await pool.query<LoginCandidate>(
        `
          select
            a.id as account_id,
            a.display_name,
            a.external_subject,
            c.password_hash,
            c.role_name
          from app_private.account_credential c
          join app_public.account a on a.id = c.account_id
          where lower(c.login_identifier) = lower($1)
            and c.is_active = true
          limit 1
        `,
        [identifier]
      );

      const candidate = rows[0];
      const isValid = candidate ? await verifyPassword(password, candidate.password_hash) : false;

      if (!candidate || !isValid) {
        recordFailedLoginAttempt(rateLimitKey);
        res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
        return;
      }

      clearFailedLoginAttempts(rateLimitKey);

      const { sessionId, sessionToken, expiresAt } = await createSessionForAccount(pool, {
        accountId: candidate.account_id,
        role: candidate.role_name
      });

      req.authSession = {
        sessionId,
        accountId: candidate.account_id,
        role: candidate.role_name,
        displayName: candidate.display_name,
        externalSubject: candidate.external_subject,
        expiresAt
      };

      res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
      res.status(200).json(toSessionPayload(req));
    } catch (error) {
      console.error("[auth] Login failed", {
        identifier,
        error
      });
      res.status(500).json({ message: GENERIC_ERROR_MESSAGE });
    }
  });

  router.post("/logout", async (req, res) => {
    try {
      const sessionToken = getSessionTokenFromRequest(req);

      if (sessionToken) {
        await revokeSessionByToken(pool, sessionToken);
      }
    } catch (error) {
      console.error("[auth] Logout failed", error);
    }

    req.authSession = null;
    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
    res.status(200).json(toSessionPayload(req));
  });

  return router;
}
