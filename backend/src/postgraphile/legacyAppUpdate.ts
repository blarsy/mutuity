import express, { type ErrorRequestHandler } from "express";
import { buildSchema, graphql } from "graphql";

// This is a retirement endpoint, not a proxy to the current application API.
// Keep it independent of the database, sessions and the modern version gate:
// shipped 0.13 clients fail open if their startup version query returns errors.
export const LEGACY_MINIMUM_CLIENT_VERSION = "1.0.0";

const schema = buildSchema(`
  scalar UUID
  type Query {
    getMinimumClientVersion: String!
  }
  input CreateClientLogInput {
    accountId: UUID
    data: String
    level: Int
    activityId: String
    clientMutationId: String
  }
  type CreateClientLogPayload {
    integer: Int
    clientMutationId: String
  }
  type Mutation {
    createClientLog(input: CreateClientLogInput!): CreateClientLogPayload
  }
`);

const rootValue = {
  getMinimumClientVersion: () => LEGACY_MINIMUM_CLIENT_VERSION,
  // The legacy logger sends startup/session errors to this same URL and does
  // not catch rejected log mutations. Acknowledge and discard them; never store
  // legacy payloads or pass legacy credentials to the new application.
  createClientLog: ({ input }: { input: { clientMutationId?: string } }) => ({
    integer: 0,
    clientMutationId: input.clientMutationId ?? null
  })
};

export function createLegacyAppUpdateRouter() {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  router.post("/", express.json({ limit: "100kb" }), (req, res, next) => {
    const body: unknown = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        !("query" in body) || typeof body.query !== "string") {
      res.status(400).json({ errors: [{ message: "A GraphQL query is required." }] });
      return;
    }

    const request = body as { query: string; operationName?: unknown; variables?: unknown };
    if ((request.operationName != null && typeof request.operationName !== "string") ||
        (request.variables != null && (typeof request.variables !== "object" || Array.isArray(request.variables)))) {
      res.status(400).json({ errors: [{ message: "Invalid GraphQL request." }] });
      return;
    }

    void graphql({
      schema,
      source: request.query,
      rootValue,
      operationName: request.operationName as string | null | undefined,
      variableValues: request.variables as Record<string, unknown> | null | undefined
    }).then((result) => res.status(200).json(result)).catch(next);
  });
  const handleInvalidJson: ErrorRequestHandler = (error, _req, res, next) => {
    if (error?.type !== "entity.parse.failed" && error?.type !== "entity.too.large") {
      next(error);
      return;
    }
    res.status(error.type === "entity.too.large" ? 413 : 400)
      .json({ errors: [{ message: "Invalid GraphQL request body." }] });
  };
  router.use(handleInvalidJson);
  return router;
}