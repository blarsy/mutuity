import "dotenv/config";

import express from "express";
import { postgraphile } from "postgraphile";

const app = express();
const ALLOWED_PG_ROLES = new Set(["anonymous", "identified_account", "manager", "admin"]);

const DATABASE_URL = process.env.DATABASE_URL;
const port = Number(process.env.BACKEND_PORT ?? 5000);

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL.");
}

// SQL functions in app_public (for example createCampaign and addCampaignModerationNote)
// are exposed as GraphQL mutations by PostGraphile.
app.use(
  postgraphile(DATABASE_URL, process.env.GRAPHILE_SCHEMA ?? "app_public", {
    graphiql: true,
    enhanceGraphiql: true,
    dynamicJson: true,
    watchPg: true,
    setofFunctionsContainNulls: false,
    extendedErrors: (process.env.GRAPHILE_EXTENDED_ERRORS ?? "hint,detail,errcode").split(","),
    pgDefaultRole: process.env.PG_DEFAULT_ROLE ?? "anonymous",
    ignoreRBAC: false,
    ignoreIndexes: false,
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
