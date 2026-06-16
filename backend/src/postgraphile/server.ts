import "dotenv/config";

import { createServer } from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { GraphQLError } from "graphql";
import { Pool } from "pg";
import { postgraphile, makePluginHook, enhanceHttpServerWithSubscriptions } from "postgraphile";
import PgPubSub from "@graphile/pg-pubsub";

import { handleAppleCallback } from "../auth/appleCallback.js";
import { handleGoogleCallback } from "../auth/googleCallback.js";
import { generateSocialAuthNonce, signSocialAuthState, signPendingLinkToken, verifyPendingLinkToken } from "../auth/socialState.js";
import { createAuthSessionMiddleware, createSessionForAccount, getSessionCookieOptions, SESSION_COOKIE_NAME } from "../auth/session.js";
import { logWebApiError, logWebApiInfo } from "../logging/operationalLogger.js";
import { createAuthGraphqlPlugin } from "./authGraphqlPlugin.js";

const app = express();
// PgPubSub is published as CJS and can appear as default.default under ESM interop.
const PgPubSubPlugin =
  ((PgPubSub as unknown as { default?: { default?: unknown } }).default?.default as object | undefined) ??
  ((PgPubSub as unknown as { default?: unknown }).default as object | undefined) ??
  (PgPubSub as unknown as object);
const pluginHook = makePluginHook([PgPubSubPlugin]);
const ALLOWED_PG_ROLES = new Set(["anonymous", "identified_account", "admin"]);
const AUTHENTICATION_ERROR_MESSAGE = "You must sign in to continue.";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const SAFE_GRAPHQL_ERROR_CODES = new Map<string, string>([
  ["Campaign start_at must be before end_at", "BAD_USER_INPUT"],
  ["Campaign airdrop_at must be between start_at and end_at", "BAD_USER_INPUT"],
  ["Topes amount must be greater than zero", "BAD_USER_INPUT"],
  ["Topes for leg_up must be between 10 and 99", "BAD_USER_INPUT"],
  ["Topes for sharing must be between 100 and 999", "BAD_USER_INPUT"],
  ["Topes for commitment must be between 1000 and 4999", "BAD_USER_INPUT"],
  ["Topes for rare_contribution must be at least 5000", "BAD_USER_INPUT"],
  ["Resource title is required", "BAD_USER_INPUT"],
  ["Resource location is required", "BAD_USER_INPUT"],
  ["Resource description must be 8000 characters or fewer", "BAD_USER_INPUT"],
  ["Resource expiration must be in the future", "BAD_USER_INPUT"],
  ["Resource must be marked as a product, a service, or both", "BAD_USER_INPUT"],
  ["One or more resource categories are invalid", "BAD_USER_INPUT"],
  ["Resource not found", "NOT_FOUND"],
  ["Resource is no longer active", "BAD_USER_INPUT"],
  ["Resource has expired", "BAD_USER_INPUT"],
  ["Resource creators cannot bid on their own resources", "FORBIDDEN"],
  ["Resource bid not found", "NOT_FOUND"],
  ["Resource bid is no longer open", "BAD_USER_INPUT"],
  ["Resource bid response must be accepted or declined", "BAD_USER_INPUT"],
  ["Only the resource creator can respond to bids", "FORBIDDEN"],
  ["required_people_count must be at least 2 when multiple_people_required is true", "BAD_USER_INPUT"],
  ["required_people_count must be positive", "BAD_USER_INPUT"],
  ["Need not found", "NOT_FOUND"],
  ["Need is no longer active", "BAD_USER_INPUT"],
  ["Need claim not found", "NOT_FOUND"],
  ["Need claim is no longer open", "BAD_USER_INPUT"],
  ["Need claim is closed", "BAD_USER_INPUT"],
  ["Only the claimer can cancel this claim", "FORBIDDEN"],
  ["Only the need creator can decline this claim", "FORBIDDEN"],
  ["Claim conversation not found", "NOT_FOUND"],
  ["Message body is required", "BAD_USER_INPUT"],
  ["Only administrators can add moderation notes", "FORBIDDEN"],
  ["Only managers can add moderation notes", "FORBIDDEN"],
  ["Moderation notes are not allowed for approved campaigns", "BAD_USER_INPUT"],
  ["Only need creator can settle claims", "FORBIDDEN"],
  ["Only claim participants can send messages", "FORBIDDEN"],
  ["Only claim participants can read messages", "FORBIDDEN"],
  ["Only resource conversation participants can send messages", "FORBIDDEN"],
  ["Only resource conversation participants can read messages", "FORBIDDEN"],
  ["Only conversation participants can update typing state", "FORBIDDEN"],
  ["Conversation can only be started by the need creator", "FORBIDDEN"],
  ["Need creator cannot message themselves", "BAD_USER_INPUT"],
  ["Resource owner cannot message themselves", "BAD_USER_INPUT"],
  ["Campaign not found", "NOT_FOUND"],
  ["Moderation notes are allowed only for pending campaigns", "BAD_USER_INPUT"],
  ["Moderation note body is required", "BAD_USER_INPUT"],
  ["Only administrators can approve campaigns", "FORBIDDEN"],
  ["Only managers can approve campaigns", "FORBIDDEN"],
  ["Campaign can only be approved from pending or awaiting adaptation status", "BAD_USER_INPUT"],
  ["Campaign can only be approved from pending status", "BAD_USER_INPUT"],
  ["Only the campaign creator can edit this campaign", "FORBIDDEN"],
  ["Campaign can only be edited while pending or awaiting adaptation", "BAD_USER_INPUT"],
  ["Only the campaign creator or administrator can view moderation events", "FORBIDDEN"],
  ["Campaign is not eligible for need linking", "BAD_USER_INPUT"],
  ["Campaign need relation not found", "NOT_FOUND"],
  ["Only the campaign creator can triage joined needs", "FORBIDDEN"],
  ["Campaign need can only be triaged from pending status", "BAD_USER_INPUT"],
  ["Campaign resource relation not found", "NOT_FOUND"],
  ["Only the campaign creator can triage joined resources", "FORBIDDEN"],
  ["Campaign resource can only be triaged from pending status", "BAD_USER_INPUT"],
  ["Recipient account not found", "NOT_FOUND"],
  ["Gift amount must be greater than zero", "BAD_USER_INPUT"],
  ["You cannot gift tokens to your own account", "BAD_USER_INPUT"],
  ["Only administrators can create or modify grants", "FORBIDDEN"],
  ["Only administrators can modify grant targets", "FORBIDDEN"],
  ["Only administrators can access admin support data", "FORBIDDEN"],
  ["Administrator account context is required", "UNAUTHENTICATED"],
  ["Grant title is required", "BAD_USER_INPUT"],
  ["Grant awarded token amount must be a positive integer", "BAD_USER_INPUT"],
  ["Grant max successful claim count must be positive", "BAD_USER_INPUT"],
  ["Grant not found", "NOT_FOUND"],
  ["Recent re-authentication is required to link social identities", "UNAUTHENTICATED"]
]);
const SAFE_GRAPHQL_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  code: string;
}> = [
  {
    pattern: /resource has expired/i,
    message: "Resource has expired",
    code: "BAD_USER_INPUT"
  },
  {
    pattern: /resource is no longer active/i,
    message: "Resource is no longer active",
    code: "BAD_USER_INPUT"
  },
  {
    pattern: /resource creators cannot bid on their own resources/i,
    message: "Resource creators cannot bid on their own resources",
    code: "FORBIDDEN"
  },
  {
    pattern: /resource bid not found/i,
    message: "Resource bid not found",
    code: "NOT_FOUND"
  },
  {
    pattern: /resource bid is no longer open/i,
    message: "Resource bid is no longer open",
    code: "BAD_USER_INPUT"
  },
  {
    pattern: /resource bid response must be accepted or declined/i,
    message: "Resource bid response must be accepted or declined",
    code: "BAD_USER_INPUT"
  },
  {
    pattern: /only the resource creator can respond to bids/i,
    message: "Only the resource creator can respond to bids",
    code: "FORBIDDEN"
  },
  {
    pattern: /campaign need relation not found/i,
    message: "Campaign need relation not found",
    code: "NOT_FOUND"
  },
  {
    pattern: /only the campaign creator can triage joined needs/i,
    message: "Only the campaign creator can triage joined needs",
    code: "FORBIDDEN"
  },
  {
    pattern: /campaign need can only be triaged from pending status/i,
    message: "Campaign need can only be triaged from pending status",
    code: "BAD_USER_INPUT"
  },
  {
    pattern: /campaign resource relation not found/i,
    message: "Campaign resource relation not found",
    code: "NOT_FOUND"
  },
  {
    pattern: /only the campaign creator can triage joined resources/i,
    message: "Only the campaign creator can triage joined resources",
    code: "FORBIDDEN"
  },
  {
    pattern: /campaign resource can only be triaged from pending status/i,
    message: "Campaign resource can only be triaged from pending status",
    code: "BAD_USER_INPUT"
  },
  {
    pattern: /only managers can/i,
    message: "Only administrators can perform this action",
    code: "FORBIDDEN"
  }
];
const AUTHENTICATION_ERROR_PATTERNS = [
  /authentication required/i,
  /permission denied for schema app_private/i,
  /permission denied for function app_private\./i
];

const DATABASE_URL = process.env.DATABASE_URL;
const port = Number(process.env.BACKEND_PORT ?? 5050);
const isProduction = process.env.NODE_ENV === "production";
const allowGraphiql = process.env.ALLOW_GRAPHIQL
  ? process.env.ALLOW_GRAPHIQL === "true"
  : !isProduction;
const watchPg = process.env.POSTGRAPHILE_WATCH_PG
  ? process.env.POSTGRAPHILE_WATCH_PG === "true"
  : !isProduction;
const allowDevAuthHeaders = process.env.ALLOW_DEV_AUTH_HEADERS !== "false";
const sessionSecret = process.env.SESSION_SECRET ?? "dev-only-change-me";
const corsAllowlist = (process.env.BACKEND_CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
const frontendBaseUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || "";
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || "";
const GOOGLE_OAUTH_CALLBACK_URL = process.env.GOOGLE_OAUTH_CALLBACK_URL?.trim() || "";
const GOOGLE_OAUTH_SCOPES = process.env.GOOGLE_OAUTH_SCOPES?.trim() || "openid email profile";
const SOCIAL_AUTH_STATE_SECRET = process.env.SOCIAL_AUTH_STATE_SECRET?.trim() || "";
const APPLE_OAUTH_CLIENT_ID = process.env.APPLE_OAUTH_CLIENT_ID?.trim() || "";
const APPLE_OAUTH_TEAM_ID = process.env.APPLE_OAUTH_TEAM_ID?.trim() || "";
const APPLE_OAUTH_KEY_ID = process.env.APPLE_OAUTH_KEY_ID?.trim() || "";
const APPLE_OAUTH_PRIVATE_KEY = process.env.APPLE_OAUTH_PRIVATE_KEY?.trim() || "";
const APPLE_OAUTH_CALLBACK_URL = process.env.APPLE_OAUTH_CALLBACK_URL?.trim() || "";
const GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const APPLE_OAUTH_AUTHORIZE_URL = "https://appleid.apple.com/auth/authorize";
const UPSERT_IDENTITY_SQL =
  "select app_private.upsert_account_identity($1, $2, $3, $4, $5, '{}'::jsonb)";
const APPLE_OAUTH_CALLBACK_ROUTE = "/auth/apple/callback";
if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL.");
}

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET in production.");
}

const pool = new Pool({
  connectionString: DATABASE_URL
});

function toLoggedError(error: GraphQLError) {
  const originalError =
    error.originalError instanceof Error
      ? {
          name: error.originalError.name,
          message: error.originalError.message,
          stack: error.originalError.stack
        }
      : error.originalError;

  return {
    message: error.message,
    path: error.path,
    extensions: error.extensions,
    originalError
  };
}

function sanitizeGraphQLError(error: GraphQLError) {
  const message = error.message;

  if (AUTHENTICATION_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return new GraphQLError(
      AUTHENTICATION_ERROR_MESSAGE,
      error.nodes,
      error.source,
      error.positions,
      error.path,
      error.originalError,
      { code: "UNAUTHENTICATED" }
    );
  }

  const safeCode = SAFE_GRAPHQL_ERROR_CODES.get(message);

  if (safeCode) {
    return new GraphQLError(
      message,
      error.nodes,
      error.source,
      error.positions,
      error.path,
      error.originalError,
      { code: safeCode }
    );
  }

  const safePatternMatch = SAFE_GRAPHQL_ERROR_PATTERNS.find(entry => entry.pattern.test(message));

  if (safePatternMatch) {
    return new GraphQLError(
      safePatternMatch.message,
      error.nodes,
      error.source,
      error.positions,
      error.path,
      error.originalError,
      { code: safePatternMatch.code }
    );
  }

  return new GraphQLError(
    GENERIC_ERROR_MESSAGE,
    error.nodes,
    error.source,
    error.positions,
    error.path,
    error.originalError,
    { code: "INTERNAL_SERVER_ERROR" }
  );
}

function isLocalBackendOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const hostnameIsLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const originPort = Number(url.port || (url.protocol === "https:" ? 443 : 80));

    return hostnameIsLocal && originPort === port;
  } catch {
    return false;
  }
}

function normalizeNextDestination(candidate: unknown) {
  const value = typeof candidate === "string" ? candidate : "/";
  return value.startsWith("/") ? value : "/";
}

function toAbsoluteUrl(candidate: string, requestBaseUrl: string) {
  const isAbsolute = /^https?:\/\//i.test(candidate);
  return isAbsolute ? new URL(candidate) : new URL(candidate, requestBaseUrl);
}

function hasGoogleOauthStartConfig() {
  return Boolean(GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CALLBACK_URL && SOCIAL_AUTH_STATE_SECRET);
}

function hasGoogleOauthCallbackConfig() {
  return Boolean(
    GOOGLE_OAUTH_CLIENT_ID
      && GOOGLE_OAUTH_CLIENT_SECRET
      && GOOGLE_OAUTH_CALLBACK_URL
      && SOCIAL_AUTH_STATE_SECRET
  );
}

function hasAppleOauthStartConfig() {
  return Boolean(
    APPLE_OAUTH_CLIENT_ID
      && APPLE_OAUTH_CALLBACK_URL
      && SOCIAL_AUTH_STATE_SECRET
  );
}

function hasAppleOauthCallbackConfig() {
  return Boolean(
    APPLE_OAUTH_CLIENT_ID
      && APPLE_OAUTH_TEAM_ID
      && APPLE_OAUTH_KEY_ID
      && APPLE_OAUTH_PRIVATE_KEY
      && APPLE_OAUTH_CALLBACK_URL
      && SOCIAL_AUTH_STATE_SECRET
  );
}

function createGoogleOAuthAuthorizeUrl(nextDestination: string) {
  const redirectUrl = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);
  const state = signSocialAuthState(
    {
      next: nextDestination
    },
    SOCIAL_AUTH_STATE_SECRET
  );

  redirectUrl.searchParams.set("client_id", GOOGLE_OAUTH_CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", GOOGLE_OAUTH_CALLBACK_URL);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPES);
  redirectUrl.searchParams.set("state", state);
  redirectUrl.searchParams.set("access_type", "offline");
  redirectUrl.searchParams.set("include_granted_scopes", "true");

  return redirectUrl;
}

function createAppleOAuthAuthorizeUrl(nextDestination: string) {
  const redirectUrl = new URL(APPLE_OAUTH_AUTHORIZE_URL);
  const nonce = generateSocialAuthNonce();
  const state = signSocialAuthState(
    {
      next: nextDestination,
      nonce
    },
    SOCIAL_AUTH_STATE_SECRET
  );

  redirectUrl.searchParams.set("client_id", APPLE_OAUTH_CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", APPLE_OAUTH_CALLBACK_URL);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("response_mode", "form_post");
  redirectUrl.searchParams.set("scope", "name email");
  redirectUrl.searchParams.set("state", state);
  redirectUrl.searchParams.set("nonce", nonce);

  return redirectUrl;
}

function buildFrontendSocialCallbackUrl(provider: "google" | "apple", input: {
  status: "success" | "register_required" | "link_confirmation_required" | "error";
  nextDestination: string;
  email?: string;
  name?: string;
  providerSubject?: string;
  error?: string;
  pendingLinkToken?: string;
}) {
  const callbackUrl = new URL(`/auth/${provider}/callback`, frontendBaseUrl);
  callbackUrl.searchParams.set("status", input.status);
  callbackUrl.searchParams.set("next", normalizeNextDestination(input.nextDestination));

  if (input.email) {
    callbackUrl.searchParams.set("email", input.email);
  }

  if (input.name) {
    callbackUrl.searchParams.set("name", input.name);
  }

  if (input.providerSubject) {
    callbackUrl.searchParams.set("providerSubject", input.providerSubject);
  }

  if (input.error) {
    callbackUrl.searchParams.set("error", input.error);
  }

  if (input.pendingLinkToken) {
    callbackUrl.searchParams.set("pendingLinkToken", input.pendingLinkToken);
  }

  return callbackUrl;
}

app.use(cookieParser(sessionSecret));
app.use(createAuthSessionMiddleware(pool));

app.use((req, res, next) => {
  if (req.path === APPLE_OAUTH_CALLBACK_ROUTE) {
    next();
    return;
  }

  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProduction && isLocalBackendOrigin(origin)) {
        callback(null, true);
        return;
      }

      if (corsAllowlist.includes("*") || corsAllowlist.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  })(req, res, next);
});

app.get("/auth/:provider/start", (req, res) => {
  const provider = req.params.provider;

  if (provider !== "google" && provider !== "apple") {
    res.status(404).json({ error: "Unsupported social provider" });
    return;
  }

  const nextDestination = normalizeNextDestination(req.query.next);
  if (provider === "google") {
    if (!hasGoogleOauthStartConfig()) {
      res.status(501).json({
        error: "Missing GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CALLBACK_URL, or SOCIAL_AUTH_STATE_SECRET configuration"
      });
      return;
    }

    const redirectUrl = createGoogleOAuthAuthorizeUrl(nextDestination);
    res.redirect(302, redirectUrl.toString());
    return;
  }

  if (!hasAppleOauthStartConfig()) {
    res.status(501).json({
      error: "Missing APPLE_OAUTH_CLIENT_ID, APPLE_OAUTH_CALLBACK_URL, or SOCIAL_AUTH_STATE_SECRET configuration"
    });
    return;
  }

  const redirectUrl = createAppleOAuthAuthorizeUrl(nextDestination);

  res.redirect(302, redirectUrl.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  if (!hasGoogleOauthCallbackConfig()) {
    res.status(501).json({
      error: "Missing GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_CALLBACK_URL, or SOCIAL_AUTH_STATE_SECRET configuration"
    });
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";

  if (!code || !state) {
    const callbackUrl = buildFrontendSocialCallbackUrl("google", {
      status: "error",
      nextDestination: "/",
      error: "Missing OAuth callback parameters"
    });
    res.redirect(302, callbackUrl.toString());
    return;
  }

  const result = await handleGoogleCallback({
    pool,
    code,
    state,
    stateSecret: SOCIAL_AUTH_STATE_SECRET,
    clientId: GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
    callbackUrl: GOOGLE_OAUTH_CALLBACK_URL
  });

  if (result.kind === "success") {
    try {
      const nextSession = await createSessionForAccount(pool, {
        accountId: result.accountId,
        role: "identified_account"
      });

      res.cookie(SESSION_COOKIE_NAME, nextSession.sessionToken, getSessionCookieOptions());
      const callbackUrl = buildFrontendSocialCallbackUrl("google", {
        status: "success",
        nextDestination: result.nextDestination
      });
      res.redirect(302, callbackUrl.toString());
      return;
    } catch (error) {
      await logWebApiError("[auth] Failed to create session after Google callback", error, {
        context: "google_callback_session_create",
        metadata: {
          accountId: result.accountId
        }
      });

      const callbackUrl = buildFrontendSocialCallbackUrl("google", {
        status: "error",
        nextDestination: result.nextDestination,
        error: "Could not create a session"
      });
      res.redirect(302, callbackUrl.toString());
      return;
    }
  }

  if (result.kind === "register_required") {
    const callbackUrl = buildFrontendSocialCallbackUrl("google", {
      status: "register_required",
      nextDestination: result.nextDestination,
      email: result.email,
      name: result.name,
      providerSubject: result.providerSubject
    });
    res.redirect(302, callbackUrl.toString());
    return;
  }

  if (result.kind === "link_confirmation_required") {
      if (result.kind === "link_confirmation_required") {
        const pendingLinkToken = SOCIAL_AUTH_STATE_SECRET
         ? signPendingLinkToken({
             provider: "google",
             providerSubject: result.providerSubject,
             providerEmail: result.email,
             providerEmailVerified: result.providerEmailVerified,
             next: result.nextDestination,
           }, SOCIAL_AUTH_STATE_SECRET)
         : undefined;   
        const callbackUrl = buildFrontendSocialCallbackUrl("google", {
          status: "link_confirmation_required",
          nextDestination: result.nextDestination,
          email: result.email,
          name: result.name,
          providerSubject: result.providerSubject,
          pendingLinkToken
        });
        res.redirect(302, callbackUrl.toString());
        return;
    }
  }

  const callbackUrl = buildFrontendSocialCallbackUrl("google", {
    status: "error",
    nextDestination: result.nextDestination,
    error: result.errorMessage
  });
  res.redirect(302, callbackUrl.toString());
});

app.get(APPLE_OAUTH_CALLBACK_ROUTE, (_req, res) => {
  res.status(405).json({
    error: "Method not allowed. Apple callback expects POST."
  });
});

app.post(APPLE_OAUTH_CALLBACK_ROUTE, express.urlencoded({ extended: false }), async (req, res) => {
  if (!hasAppleOauthCallbackConfig()) {
    res.status(501).json({
      error: "Missing APPLE_OAUTH_CLIENT_ID, APPLE_OAUTH_TEAM_ID, APPLE_OAUTH_KEY_ID, APPLE_OAUTH_PRIVATE_KEY, APPLE_OAUTH_CALLBACK_URL, or SOCIAL_AUTH_STATE_SECRET configuration"
    });
    return;
  }

  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const state = typeof req.body?.state === "string" ? req.body.state : "";
  const userPayload = typeof req.body?.user === "string" ? req.body.user : undefined;

  if (!code || !state) {
    const callbackUrl = buildFrontendSocialCallbackUrl("apple", {
      status: "error",
      nextDestination: "/",
      error: "Missing OAuth callback parameters"
    });
    res.redirect(302, callbackUrl.toString());
    return;
  }

  const result = await handleAppleCallback({
    pool,
    code,
    state,
    userPayload,
    stateSecret: SOCIAL_AUTH_STATE_SECRET,
    clientId: APPLE_OAUTH_CLIENT_ID,
    teamId: APPLE_OAUTH_TEAM_ID,
    keyId: APPLE_OAUTH_KEY_ID,
    privateKey: APPLE_OAUTH_PRIVATE_KEY,
    callbackUrl: APPLE_OAUTH_CALLBACK_URL
  });

  if (result.kind === "success") {
    try {
      const nextSession = await createSessionForAccount(pool, {
        accountId: result.accountId,
        role: "identified_account"
      });

      res.cookie(SESSION_COOKIE_NAME, nextSession.sessionToken, getSessionCookieOptions());
      const callbackUrl = buildFrontendSocialCallbackUrl("apple", {
        status: "success",
        nextDestination: result.nextDestination
      });
      res.redirect(302, callbackUrl.toString());
      return;
    } catch (error) {
      await logWebApiError("[auth] Failed to create session after Apple callback", error, {
        context: "apple_callback_session_create",
        metadata: {
          accountId: result.accountId
        }
      });

      const callbackUrl = buildFrontendSocialCallbackUrl("apple", {
        status: "error",
        nextDestination: result.nextDestination,
        error: "Could not create a session"
      });
      res.redirect(302, callbackUrl.toString());
      return;
    }
  }

  if (result.kind === "register_required") {
    const callbackUrl = buildFrontendSocialCallbackUrl("apple", {
      status: "register_required",
      nextDestination: result.nextDestination,
      email: result.email,
      name: result.name,
      providerSubject: result.providerSubject
    });
    res.redirect(302, callbackUrl.toString());
    return;
  }

  if (result.kind === "link_confirmation_required") {
       const pendingLinkToken = SOCIAL_AUTH_STATE_SECRET
        ? signPendingLinkToken({
            provider: "apple",
            providerSubject: result.providerSubject,
            providerEmail: result.email,
            providerEmailVerified: result.providerEmailVerified,
            next: result.nextDestination,
          }, SOCIAL_AUTH_STATE_SECRET)
        : undefined;
    const callbackUrl = buildFrontendSocialCallbackUrl("apple", {
      status: "link_confirmation_required",
      nextDestination: result.nextDestination,
      email: result.email,
      name: result.name,
      providerSubject: result.providerSubject,
      pendingLinkToken
    });
    res.redirect(302, callbackUrl.toString());
    return;
  }

  const callbackUrl = buildFrontendSocialCallbackUrl("apple", {
    status: "error",
    nextDestination: result.nextDestination,
    error: result.errorMessage
  });
  res.redirect(302, callbackUrl.toString());
});

// SQL functions in app_public (for example createCampaign and addCampaignModerationNote)
// are exposed as GraphQL mutations by PostGraphile.
const postgraphileMiddleware = postgraphile(
  DATABASE_URL,
  process.env.GRAPHILE_SCHEMA ?? "app_public",
  {
    pluginHook,
    subscriptions: true,
    simpleSubscriptions: true,
    graphileBuildOptions: {
      pgSubscriptionPrefix: ""
    },
    // Subscriptions share the same session/cookie middleware as HTTP requests.
    websocketMiddlewares: [
      cookieParser(sessionSecret),
      createAuthSessionMiddleware(pool)
    ],
    graphiql: allowGraphiql,
    enhanceGraphiql: allowGraphiql,
    dynamicJson: true,
    watchPg,
    setofFunctionsContainNulls: false,
    ignoreRBAC: false,
    ignoreIndexes: false,
    appendPlugins: [createAuthGraphqlPlugin(pool)],
    handleErrors: errors => {
      for (const error of errors) {
        console.error("[postgraphile] GraphQL request failed", toLoggedError(error));
        void logWebApiError("GraphQL request failed", error, {
          path: error.path,
          extensions: error.extensions,
          originalError: toLoggedError(error).originalError
        });
      }

      return errors.map(sanitizeGraphQLError);
    },
    pgSettings: req => {
      const session = (
        req as express.Request & {
          authSession?: {
            accountId: string;
            role: string;
          } | null;
        }
      ).authSession ?? null;

      if (session) {
        return {
          role: session.role,
          "jwt.claims.role": session.role,
          "jwt.claims.account_id": session.accountId,
          "jwt.claims.session_id": session.sessionId
        };
      }

      const canUseDevHeaders = allowDevAuthHeaders && process.env.NODE_ENV !== "production";
      const accountIdHeader = canUseDevHeaders ? String(req.headers["x-account-id"] ?? "") : "";
      const requestedRole = canUseDevHeaders
        ? String(req.headers["x-role"] ?? process.env.PG_DEFAULT_ROLE ?? "anonymous")
        : "anonymous";
      const role = ALLOWED_PG_ROLES.has(requestedRole) ? requestedRole : "anonymous";

      return {
        role,
        "jwt.claims.role": role,
        "jwt.claims.account_id": accountIdHeader
      };
    },
    additionalGraphQLContextFromRequest: async (req, res) => ({
      expressReq: req as express.Request,
      expressRes: res as express.Response
    })
  }
);

app.post("/auth/social/confirm-link", express.json(), async (req, res) => {
  if (!req.authSession) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const rawToken = typeof req.body?.pendingLinkToken === "string" ? req.body.pendingLinkToken : "";
  if (!rawToken) {
    res.status(400).json({ error: "Missing pendingLinkToken" });
    return;
  }

  const pending = verifyPendingLinkToken(rawToken, SOCIAL_AUTH_STATE_SECRET);
  if (!pending) {
    res.status(400).json({ error: "Invalid or expired pending link token" });
    return;
  }

  try {
    await pool.query(UPSERT_IDENTITY_SQL, [
      req.authSession.accountId,
      pending.provider,
      pending.providerSubject,
      pending.providerEmail,
      pending.providerEmailVerified,
    ]);
    res.status(200).json({ status: "linked" });
  } catch (error) {
    await logWebApiError("[auth] Failed to confirm pending social link", error, {
      context: "confirm_pending_link",
    });
    res.status(500).json({ error: "Failed to link identity" });
  }
});

app.use(postgraphileMiddleware);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Upgrade the HTTP server to handle WebSocket connections for GraphQL subscriptions.
const httpServer = createServer(app);
enhanceHttpServerWithSubscriptions(httpServer, postgraphileMiddleware);

httpServer.listen(port, () => {
  // Keep logs concise for local bootstrap.
  console.log(`PostGraphile server listening on http://localhost:${port}/graphiql`);
  void logWebApiInfo("PostGraphile server listening", {
    port,
    graphiql: allowGraphiql,
    watchPg
  });
});
