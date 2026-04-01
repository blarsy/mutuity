import "dotenv/config";

import cors from "cors";
import express from "express";
import { GraphQLError } from "graphql";
import { postgraphile } from "postgraphile";

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
  ["required_people_count must be at least 2 when multiple_people_required is true", "BAD_USER_INPUT"],
  ["required_people_count must be positive", "BAD_USER_INPUT"],
  ["Only managers can add moderation notes", "FORBIDDEN"],
  ["Campaign not found", "NOT_FOUND"],
  ["Moderation notes are allowed only for pending campaigns", "BAD_USER_INPUT"],
  ["Moderation note body is required", "BAD_USER_INPUT"]
]);
const AUTHENTICATION_ERROR_PATTERNS = [
  /authentication required/i,
  /permission denied for schema app_private/i,
  /permission denied for function app_private\./i
];

const DATABASE_URL = process.env.DATABASE_URL;
const port = Number(process.env.BACKEND_PORT ?? 5050);
const corsAllowlist = (process.env.BACKEND_CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL.");
}

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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin and non-browser requests (no Origin header).
      if (!origin) {
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
    graphiql: true,
    enhanceGraphiql: true,
    dynamicJson: true,
    watchPg: true,
    setofFunctionsContainNulls: false,
    ignoreRBAC: false,
    ignoreIndexes: false,
    handleErrors: errors => {
      for (const error of errors) {
        console.error("[postgraphile] GraphQL request failed", toLoggedError(error));
      }

      return errors.map(sanitizeGraphQLError);
    },
    pgSettings: req => {
      const accountIdHeader = String(req.headers["x-account-id"] ?? "");
      const requestedRole = String(req.headers["x-role"] ?? process.env.PG_DEFAULT_ROLE ?? "anonymous");
      const role = ALLOWED_PG_ROLES.has(requestedRole) ? requestedRole : "anonymous";

      return {
        role,
        "jwt.claims.role": role,
        "jwt.claims.account_id": accountIdHeader
      };
    }
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  // Keep logs concise for local bootstrap.
  console.log(`PostGraphile server listening on http://localhost:${port}/graphiql`);
});
