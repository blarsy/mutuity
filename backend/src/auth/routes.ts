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

type LoginCandidate = {
  account_id: string;
  display_name: string | null;
  external_subject: string;
  password_hash: string;
  role_name: string;
};

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

    if (identifier.length === 0 || password.length === 0) {
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
        res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
        return;
      }

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
