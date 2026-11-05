import type { RequestHandler } from "express";
import type { Pool } from "pg";

// One outstanding ping per process, including while waiting for a pool slot.
export function createReadinessHandler(ping: () => Promise<unknown>, timeoutMs = 1000): RequestHandler {
  let pending: Promise<unknown> | undefined;
  return async (_req, res) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!pending) {
        pending = Promise.resolve().then(ping).finally(() => { pending = undefined; });
      }
      await Promise.race([pending, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Readiness timeout")), timeoutMs);
      })]);
      res.status(200).json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}

export function createDatabasePing(pool: Pool) {
  return async () => {
    const client = await pool.connect();
    let failed = false;
    try {
      // pg supports a per-query timeout; older @types/pg omit this property.
      const query = { text: "select 1", query_timeout: 1000 };
      await client.query(query);
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      client.release(failed);
    }
  };
}