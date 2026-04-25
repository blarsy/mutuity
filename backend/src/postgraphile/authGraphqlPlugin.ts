import type express from "express";
import { GraphQLError } from "graphql";
import { gql, makeExtendSchemaPlugin } from "graphile-utils";
import type { Pool } from "pg";

import { hashPassword, verifyPassword } from "../auth/credentials.js";
import { logWebApiError } from "../logging/operationalLogger.js";
import {
  createSessionForAccount,
  getSessionCookieOptions,
  getSessionTokenFromRequest,
  revokeSessionByToken,
  SESSION_COOKIE_NAME
} from "../auth/session.js";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const INVALID_CREDENTIALS_MESSAGE = "Unable to sign in with those credentials.";
const PASSWORD_CHANGE_INVALID_CURRENT_MESSAGE = "Current password is incorrect.";
const PASSWORD_CHANGE_REQUIRE_AUTH_MESSAGE = "You must be signed in to change your password.";
const PASSWORD_MIN_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH ?? 8);
const TOO_MANY_ATTEMPTS_MESSAGE = "Too many sign-in attempts. Please wait a moment and try again.";
const LOGIN_RATE_LIMIT_WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000);
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? 5);
const SELECT_LOGIN_CANDIDATE_SQL = "select * from app_private.find_login_candidate($1);";
const READ_ACCOUNT_PASSWORD_HASH_SQL =
  "select app_private.read_account_password_hash($1) as password_hash;";
const UPDATE_ACCOUNT_PASSWORD_SQL = "select app_private.update_account_password($1, $2, $3);";
const loginAttemptTracker = new Map<string, number[]>();

type AuthGraphQLContext = {
  req?: express.Request;
  res?: express.Response;
  expressReq?: express.Request;
  expressRes?: express.Response;
};

type LoginCandidate = {
  account_id: string;
  display_name: string | null;
  external_subject: string;
  avatar_url: string | null;
  password_hash: string;
  role_name: string;
  email_verified_at: Date | null;
  preferred_language: string;
};

type PasswordHashRow = {
  password_hash: string;
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
      externalSubject: session.externalSubject,
        avatarUrl: session.avatarUrl,
        emailVerified: session.emailVerified,
        preferredLanguage: session.preferredLanguage
    },
    role: session.role,
    expiresAt: session.expiresAt
  };
}

function getRequestAndResponse(context: AuthGraphQLContext) {
  const req = context.expressReq ?? context.req;
  const res = context.expressRes ?? context.res ?? req?.res;

  if (!req || !res) {
    throw new GraphQLError(
      GENERIC_ERROR_MESSAGE,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { code: "INTERNAL_SERVER_ERROR" }
    );
  }

  return { req, res };
}

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

function assertStrongPassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new GraphQLError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { code: "BAD_USER_INPUT" }
    );
  }
}

export function createAuthGraphqlPlugin(pool: Pool) {
  return makeExtendSchemaPlugin(() => ({
    typeDefs: gql`
      type AuthSessionAccount {
        id: String!
        displayName: String
        externalSubject: String!
        avatarUrl: String
        emailVerified: Boolean!
        preferredLanguage: String!
      }

      type AuthSessionPayload {
        authenticated: Boolean!
        account: AuthSessionAccount
        role: String!
        expiresAt: String
      }

      input AuthLoginInput {
        identifier: String!
        password: String!
        clientMutationId: String
      }

      type AuthLoginPayload {
        clientMutationId: String
        authSession: AuthSessionPayload!
      }

      input AuthLogoutInput {
        clientMutationId: String
      }

      type AuthLogoutPayload {
        clientMutationId: String
        authSession: AuthSessionPayload!
      }

      input AuthChangePasswordInput {
        currentPassword: String!
        newPassword: String!
        clientMutationId: String
      }

      type AuthChangePasswordPayload {
        clientMutationId: String
        authSession: AuthSessionPayload!
      }

      extend type Query {
        authSession: AuthSessionPayload!
      }

      extend type Mutation {
        authLogin(input: AuthLoginInput!): AuthLoginPayload
        authLogout(input: AuthLogoutInput!): AuthLogoutPayload
        authChangePassword(input: AuthChangePasswordInput!): AuthChangePasswordPayload
      }
    `,
    resolvers: {
      Query: {
        authSession: (_query, _args, context: AuthGraphQLContext) => {
          const { req } = getRequestAndResponse(context);
          return toSessionPayload(req);
        }
      },
      Mutation: {
        authLogin: async (_mutation, args: { input: { identifier: string; password: string; clientMutationId?: string | null } }, context: AuthGraphQLContext) => {
          const { req, res } = getRequestAndResponse(context);
          const identifier = String(args.input.identifier ?? "").trim();
          const password = String(args.input.password ?? "");
          const rateLimitKey = getRateLimitKey(req, identifier || "anonymous");

          if (isLoginRateLimited(rateLimitKey)) {
            throw new GraphQLError(
              TOO_MANY_ATTEMPTS_MESSAGE,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { code: "RATE_LIMITED" }
            );
          }

          if (identifier.length === 0 || password.length === 0) {
            recordFailedLoginAttempt(rateLimitKey);
            throw new GraphQLError(
              INVALID_CREDENTIALS_MESSAGE,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { code: "UNAUTHENTICATED" }
            );
          }

          try {
            const { rows } = await pool.query<LoginCandidate>(SELECT_LOGIN_CANDIDATE_SQL, [identifier]);
            const candidate = rows[0];
            const isValid = candidate ? await verifyPassword(password, candidate.password_hash) : false;

            if (!candidate || !isValid) {
              recordFailedLoginAttempt(rateLimitKey);
              throw new GraphQLError(
                INVALID_CREDENTIALS_MESSAGE,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                { code: "UNAUTHENTICATED" }
              );
            }

            clearFailedLoginAttempts(rateLimitKey);

            const nextSession = await createSessionForAccount(pool, {
              accountId: candidate.account_id,
              role: candidate.role_name
            });

            req.authSession = {
              sessionId: nextSession.sessionId,
              accountId: candidate.account_id,
              role: candidate.role_name,
              displayName: candidate.display_name,
              externalSubject: candidate.external_subject,
              avatarUrl: candidate.avatar_url,
              emailVerified: Boolean(candidate.email_verified_at),
              preferredLanguage: candidate.preferred_language,
              expiresAt: nextSession.expiresAt
            };

            res.cookie(SESSION_COOKIE_NAME, nextSession.sessionToken, getSessionCookieOptions());

            return {
              clientMutationId: args.input.clientMutationId ?? null,
              authSession: toSessionPayload(req)
            };
          } catch (error) {
            if (error instanceof GraphQLError) {
              throw error;
            }

            console.error("[auth] GraphQL login failed", { identifier, error });
            await logWebApiError("[auth] GraphQL login failed", error, {
              context: "auth_graphql_login",
              metadata: {
                identifier
              }
            });
            throw new GraphQLError(
              GENERIC_ERROR_MESSAGE,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { code: "INTERNAL_SERVER_ERROR" }
            );
          }
        },
        authLogout: async (_mutation, args: { input: { clientMutationId?: string | null } }, context: AuthGraphQLContext) => {
          const { req, res } = getRequestAndResponse(context);

          try {
            const sessionToken = getSessionTokenFromRequest(req);

            if (sessionToken) {
              await revokeSessionByToken(pool, sessionToken);
            }
          } catch (error) {
            console.error("[auth] GraphQL logout failed", error);
            await logWebApiError("[auth] GraphQL logout failed", error, {
              context: "auth_graphql_logout"
            });
          }

          req.authSession = null;
          res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());

          return {
            clientMutationId: args.input.clientMutationId ?? null,
            authSession: toSessionPayload(req)
          };
        },
        authChangePassword: async (
          _mutation,
          args: { input: { currentPassword: string; newPassword: string; clientMutationId?: string | null } },
          context: AuthGraphQLContext
        ) => {
          const { req, res } = getRequestAndResponse(context);
          const session = req.authSession ?? null;

          if (!session) {
            throw new GraphQLError(
              PASSWORD_CHANGE_REQUIRE_AUTH_MESSAGE,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { code: "UNAUTHENTICATED" }
            );
          }

          const currentPassword = String(args.input.currentPassword ?? "");
          const newPassword = String(args.input.newPassword ?? "");

          assertStrongPassword(newPassword);

          try {
            const { rows } = await pool.query<PasswordHashRow>(READ_ACCOUNT_PASSWORD_HASH_SQL, [session.accountId]);
            const credential = rows[0];
            const validCurrentPassword = credential
              ? await verifyPassword(currentPassword, credential.password_hash)
              : false;

            if (!validCurrentPassword) {
              throw new GraphQLError(
                PASSWORD_CHANGE_INVALID_CURRENT_MESSAGE,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                { code: "UNAUTHENTICATED" }
              );
            }

            const newPasswordHash = await hashPassword(newPassword);
            await pool.query(UPDATE_ACCOUNT_PASSWORD_SQL, [session.accountId, newPasswordHash, null]);

            const nextSession = await createSessionForAccount(pool, {
              accountId: session.accountId,
              role: session.role
            });

            req.authSession = {
              ...session,
              sessionId: nextSession.sessionId,
              expiresAt: nextSession.expiresAt
            };

            res.cookie(SESSION_COOKIE_NAME, nextSession.sessionToken, getSessionCookieOptions());

            return {
              clientMutationId: args.input.clientMutationId ?? null,
              authSession: toSessionPayload(req)
            };
          } catch (error) {
            if (error instanceof GraphQLError) {
              throw error;
            }

            console.error("[auth] GraphQL password change failed", error);
            await logWebApiError("[auth] GraphQL password change failed", error, {
              context: "auth_graphql_change_password",
              accountId: session.accountId
            });
            throw new GraphQLError(
              GENERIC_ERROR_MESSAGE,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { code: "INTERNAL_SERVER_ERROR" }
            );
          }
        }
      }
    }
  }));
}