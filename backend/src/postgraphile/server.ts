import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { GraphQLError } from "graphql";
import { Pool } from "pg";
import { postgraphile } from "postgraphile";

import { createAuthSessionMiddleware } from "../auth/session.js";
import { logWebApiError, logWebApiInfo } from "../logging/operationalLogger.js";
import { createAuthGraphqlPlugin } from "./authGraphqlPlugin.js";

const app = express();
const ALLOWED_PG_ROLES = new Set(["anonymous", "identified_account", "manager", "admin"]);
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
  ["Claim conversation not found", "NOT_FOUND"],
  ["Message body is required", "BAD_USER_INPUT"],
  ["Only managers can add moderation notes", "FORBIDDEN"],
  ["Only need creator can settle claims", "FORBIDDEN"],
  ["Only claim participants can send messages", "FORBIDDEN"],
  ["Only claim participants can read messages", "FORBIDDEN"],
  ["Conversation can only be started by the need creator", "FORBIDDEN"],
  ["Campaign not found", "NOT_FOUND"],
  ["Moderation notes are allowed only for pending campaigns", "BAD_USER_INPUT"],
  ["Moderation note body is required", "BAD_USER_INPUT"],
  ["Only managers can approve campaigns", "FORBIDDEN"],
  ["Campaign can only be approved from pending status", "BAD_USER_INPUT"],
  ["Campaign is not eligible for need linking", "BAD_USER_INPUT"],
  ["Campaign need relation not found", "NOT_FOUND"],
  ["Only the campaign creator can triage joined needs", "FORBIDDEN"],
  ["Campaign need can only be triaged from pending status", "BAD_USER_INPUT"],
  ["Recipient account not found", "NOT_FOUND"],
  ["Gift amount must be greater than zero", "BAD_USER_INPUT"],
  ["You cannot gift tokens to your own account", "BAD_USER_INPUT"],
  ["Only administrators can create or modify grants", "FORBIDDEN"],
  ["Only administrators can modify grant targets", "FORBIDDEN"],
  ["Administrator account context is required", "UNAUTHENTICATED"],
  ["Grant title is required", "BAD_USER_INPUT"],
  ["Grant awarded token amount must be a positive integer", "BAD_USER_INPUT"],
  ["Grant max successful claim count must be positive", "BAD_USER_INPUT"],
  ["Grant not found", "NOT_FOUND"]
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

app.use(cookieParser(sessionSecret));
app.use(createAuthSessionMiddleware(pool));
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow same-origin and non-browser requests (no Origin header).
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
  })
);

// SQL functions in app_public (for example createCampaign and addCampaignModerationNote)
// are exposed as GraphQL mutations by PostGraphile.
app.use(
  postgraphile(DATABASE_URL, process.env.GRAPHILE_SCHEMA ?? "app_public", {
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
          "jwt.claims.account_id": session.accountId
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
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  // Keep logs concise for local bootstrap.
  console.log(`PostGraphile server listening on http://localhost:${port}/graphiql`);
  void logWebApiInfo("PostGraphile server listening", {
    port,
    graphiql: allowGraphiql,
    watchPg
  });
});
