import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { compareVersions } from "../../src/postgraphile/version.js";
import { createLegacyAppUpdateRouter } from "../../src/postgraphile/legacyAppUpdate.js";

describe("legacy 0.13 mandatory-update endpoint", () => {
  let server: Server;
  let url: string;
  const downstream = jest.fn();

  beforeAll(async () => {
    const app = express();
    app.use("/v0_13/graphql", createLegacyAppUpdateRouter());
    app.use((_req, res) => {
      downstream();
      res.sendStatus(401);
    });
    server = createServer(app);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v0_13/graphql`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  afterEach(() => {
    expect(downstream).not.toHaveBeenCalled();
  });

  function post(body: unknown, headers: Record<string, string> = {}) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body)
    });
  }

  it.each([{}, { authorization: "Bearer retired-token", cookie: "session=invalid" }, {
    "x-app-version": "0.13.1", "x-app-platform": "ios"
  }])("answers the exact shipped startup operation regardless of credentials/headers: %j", async (headers) => {
    const response = await post({
      operationName: "GetMinimumClientVersion",
      query: "query GetMinimumClientVersion { getMinimumClientVersion }",
      variables: {}
    }, headers as Record<string, string>);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({ data: { getMinimumClientVersion: "1.0.0" } });
    for (const installed of ["0.13.0", "0.13.1"]) {
      expect(compareVersions(installed, body.data.getMinimumClientVersion)).toBe(-1);
    }
  });

  it("supports GraphQL aliases, fragments and anonymous version queries", async () => {
    const response = await post({ query: "{ ...Version } fragment Version on Query { minimum: getMinimumClientVersion }" });
    expect(await response.json()).toEqual({ data: { minimum: "1.0.0" } });
  });

  it("acknowledges and discards the exact legacy startup logging mutation", async () => {
    const response = await post({
      operationName: "CreateClientLog",
      query: `mutation CreateClientLog($accountId: UUID, $data: String, $level: Int, $activityId: String) {
        createClientLog(input: {accountId: $accountId, data: $data, level: $level, activityId: $activityId}) { integer }
      }`,
      variables: { accountId: null, data: "Old session failed", level: 3, activityId: "legacy-activity" }
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { createClientLog: { integer: 0 } } });
  });

  it.each([
    "query GetSessionData { getSessionData { accountId } }",
    "mutation { deleteAccount { integer } }",
    "query GetMinimumClientVersion { getMinimumClientVersion getSessionData { accountId } }",
    "not valid GraphQL"
  ])("rejects unsupported operations without forwarding them: %s", async (query) => {
    const response = await post({ query });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.errors.length).toBeGreaterThan(0);
    expect(body.data).toBeUndefined();
  });

  it.each([null, [], {}, { query: 123 }, { query: "{ getMinimumClientVersion }", variables: [] }, {
    query: "{ getMinimumClientVersion }", operationName: 123
  }])("rejects malformed envelopes: %j", async (body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect((await response.json()).errors.length).toBeGreaterThan(0);
  });

  it.each(["{", JSON.stringify({ query: "x".repeat(110_000) })])("returns JSON for invalid or oversized JSON bodies", async (body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    });
    expect([400, 413]).toContain(response.status);
    expect((await response.json()).errors.length).toBeGreaterThan(0);
  });

  it("does not redirect a trailing slash", async () => {
    const response = await fetch(`${url}/`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ getMinimumClientVersion }" })
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { getMinimumClientVersion: "1.0.0" } });
  });
});