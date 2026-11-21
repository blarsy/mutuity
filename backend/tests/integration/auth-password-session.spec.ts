import type { Pool } from "pg";
import { createAuthGraphqlPlugin } from "../../src/postgraphile/authGraphqlPlugin";
import { createSessionForAccount } from "../../src/auth/session";

jest.mock("graphile-utils", () => ({
  gql: (parts: TemplateStringsArray) => parts.join(""),
  makeExtendSchemaPlugin: (factory: () => unknown) => factory()
}));
jest.mock("../../src/auth/credentials", () => ({
  verifyPassword: jest.fn().mockResolvedValue(true),
  hashPassword: jest.fn().mockResolvedValue("new-password-hash")
}));
jest.mock("../../src/auth/session", () => ({
  createSessionForAccount: jest.fn().mockResolvedValue({ sessionId: "rotated", sessionToken: "rotated-token", expiresAt: "2030-01-01" }),
  getSessionCookieOptions: jest.fn().mockReturnValue({}),
  getSessionTokenFromRequest: jest.fn(),
  revokeSessionByToken: jest.fn(),
  SESSION_COOKIE_NAME: "mutuity_session"
}));

describe("password change session continuity", () => {
  const session = {
    sessionId: "current-session", accountId: "account-a", role: "identified_account",
    displayName: "Account", externalSubject: "account@example.com", avatarUrl: null,
    emailVerified: true, preferredLanguage: "en", expiresAt: "2030-01-01"
  };
  const args = { input: { currentPassword: "old-password", newPassword: "new-password" } };

  beforeEach(() => jest.clearAllMocks());

  it.each(["ios", "android"])("keeps the active %s bearer session and revokes other sessions", async platform => {
    const query = jest.fn().mockResolvedValue({ rows: [{ password_hash: "old-hash" }] });
    const plugin = createAuthGraphqlPlugin({ query } as unknown as Pool) as unknown as {
      resolvers: { Mutation: { authChangePassword: (root: unknown, args: unknown, context: unknown) => Promise<unknown> } };
    };
    const req = { headers: { "x-app-platform": platform, authorization: "Bearer social-session" }, authSession: { ...session } };
    const res = { cookie: jest.fn() };
    await expect(plugin.resolvers.Mutation.authChangePassword(null, args, { req, res })).resolves.toMatchObject({ authSession: { authenticated: true } });
    expect(query).toHaveBeenLastCalledWith("select app_private.update_account_password($1, $2, $3);", ["account-a", "new-password-hash", "current-session"]);
    expect(createSessionForAccount).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("continues rotating a web cookie session", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ password_hash: "old-hash" }] });
    const plugin = createAuthGraphqlPlugin({ query } as unknown as Pool) as unknown as {
      resolvers: { Mutation: { authChangePassword: (root: unknown, args: unknown, context: unknown) => Promise<unknown> } };
    };
    const req = { headers: {}, authSession: { ...session } };
    const res = { cookie: jest.fn() };
    await plugin.resolvers.Mutation.authChangePassword(null, args, { req, res });
    expect(query).toHaveBeenLastCalledWith("select app_private.update_account_password($1, $2, $3);", ["account-a", "new-password-hash", null]);
    expect(createSessionForAccount).toHaveBeenCalledWith(expect.anything(), { accountId: "account-a", role: "identified_account" });
    expect(res.cookie).toHaveBeenCalledWith("mutuity_session", "rotated-token", {});
  });
});