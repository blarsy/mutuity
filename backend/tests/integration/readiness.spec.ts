import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Pool } from "pg";
import { createDatabasePing, createReadinessHandler } from "../../src/postgraphile/readiness";

let server: Server;
async function serve(ping: () => Promise<unknown>, timeout = 30) {
  const app = express();
  app.get("/ready", createReadinessHandler(ping, timeout));
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/ready`;
}
afterEach(async () => {
  if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

it("returns readiness when database ping succeeds", async () => {
  const ping = jest.fn().mockResolvedValue({});
  const response = await fetch(await serve(ping));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ready" });
  expect(ping).toHaveBeenCalledTimes(1);
});

it("returns safe 503 without leaking database credentials/details", async () => {
  const response = await fetch(await serve(async () => { throw new Error("postgres://secret@database/private"); }));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable" });
});

it("bounds stuck connections and shares one pending ping", async () => {
  let resolve!: () => void;
  const ping = jest.fn(() => new Promise<void>(done => { resolve = done; }));
  const url = await serve(ping);
  expect((await fetch(url)).status).toBe(503);
  expect((await fetch(url)).status).toBe(503);
  expect(ping).toHaveBeenCalledTimes(1);
  resolve();
});

it("uses a bounded read-only ping and releases/destroys clients on errors", async () => {
  const client = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
  const ping = createDatabasePing({ connect: jest.fn().mockResolvedValue(client) } as unknown as Pool);
  await ping();
  expect(client.query).toHaveBeenCalledWith({ text: "select 1", query_timeout: 1000 });
  expect(client.release).toHaveBeenLastCalledWith(false);
  client.query.mockRejectedValueOnce(new Error("query timeout"));
  await expect(ping()).rejects.toThrow("query timeout");
  expect(client.release).toHaveBeenLastCalledWith(true);
});