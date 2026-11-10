import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
import cookieParser from "cookie-parser";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { Pool } from "pg";

import {
  createAuthSessionMiddleware,
  createSessionForAccount,
  getSessionTokenFromRequest,
  revokeSessionByToken,
  SESSION_COOKIE_NAME
} from "../../src/auth/session";

describe("session credential extraction", () => {
  it.each(["Bearer opaque-session-token", "bearer opaque-session-token", "BEARER\topaque-session-token  "])(
    "accepts a native Authorization header: %s",
    authorization => {
      expect(getSessionTokenFromRequest({ headers: { authorization } })).toBe("opaque-session-token");
    }
  );

  it.each([undefined, "", "Basic abc", "Bearer", "Bearer ", "Bearer one two", "Bearer one, Bearer two", ["Bearer one", "Bearer two"]])(
    "rejects missing or ambiguous Bearer credentials: %s",
    authorization => {
      expect(getSessionTokenFromRequest({ headers: { authorization } })).toBeNull();
    }
  );

  it("preserves signed-cookie and password-session precedence", () => {
    const req = {
      signedCookies: { [SESSION_COOKIE_NAME]: "signed-session" },
      cookies: { [SESSION_COOKIE_NAME]: "password-session" },
      headers: { authorization: "Bearer native-session" }
    };
    expect(getSessionTokenFromRequest(req)).toBe("signed-session");
    expect(getSessionTokenFromRequest({ ...req, signedCookies: {} })).toBe("password-session");
    expect(getSessionTokenFromRequest({ cookies: req.cookies })).toBe("password-session");
    expect(getSessionTokenFromRequest({})).toBeNull();
  });
});

describe("native session authentication middleware", () => {
  const accountId = "7b15d747-2f5c-4078-9d7c-6a453734ce7a";
  const row = {
    session_id: "social-session-id",
    account_id: accountId,
    role_name: "identified_account",
    expires_at: new Date("2030-01-01T00:00:00Z"),
    display_name: "Test account",
    external_subject: "google-subject",
    avatar_url: null,
    email_verified_at: new Date(),
    preferred_language: "en"
  };
  const query = jest.fn();
  const pool = { query } as unknown as Pool;

  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (sql: string) => ({
      rows: sql.includes("find_account_session") ? [row] : []
    }));
  });

  async function resolveSession(authorization?: string) {
    // Also represents the IncomingMessage passed through websocketMiddlewares:
    // native WebSocket upgrade credentials live in headers, without cookies.
    const req = { headers: authorization ? { authorization } : {} } as Request;
    const next = jest.fn();
    await createAuthSessionMiddleware(pool)(req, {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
    return req.authSession;
  }

  it("validates an issued social session through its database hash without cookies or dev headers", async () => {
    const { sessionToken } = await createSessionForAccount(pool, { accountId, role: "identified_account" });
    query.mockClear();

    expect(await resolveSession(`Bearer ${sessionToken}`)).toMatchObject({
      accountId,
      sessionId: row.session_id,
      role: "identified_account",
      emailVerified: true
    });
    const hash = createHash("sha256").update(sessionToken).digest("hex");
    expect(query).toHaveBeenNthCalledWith(1, "select * from app_private.find_account_session($1);", [hash]);
    expect(query).toHaveBeenNthCalledWith(2, "select app_private.touch_account_session($1);", [hash]);
  });

  it.each(["expired", "revoked", "unknown"])("does not authenticate a %s session", async token => {
    query.mockResolvedValue({ rows: [] });
    expect(await resolveSession(`Bearer ${token}`)).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("does not query the database for anonymous or malformed requests", async () => {
    expect(await resolveSession()).toBeNull();
    expect(await resolveSession("Basic token")).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it("fails closed when the session lookup fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      query.mockRejectedValue(new Error("Session lookup unavailable"));
      expect(await resolveSession("Bearer native-session")).toBeNull();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("revokes the same Bearer credential used for authentication", async () => {
    const token = getSessionTokenFromRequest({ headers: { authorization: "Bearer native-session" } });
    await revokeSessionByToken(pool, token!);
    expect(query).toHaveBeenCalledWith("select app_private.revoke_account_session($1);", [
      createHash("sha256").update("native-session").digest("hex")
    ]);
  });

  it("authenticates a real native HTTP request through the production middleware chain", async () => {
    const app = express();
    app.use(cookieParser("test-session-secret"));
    app.use(createAuthSessionMiddleware(pool));
    app.get("/session", (req, res) => {
      res.json({ accountId: req.authSession?.accountId ?? null });
    });
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/session`, {
        headers: { authorization: "Bearer native-social-session" }
      });
      expect(await response.json()).toEqual({ accountId });
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});