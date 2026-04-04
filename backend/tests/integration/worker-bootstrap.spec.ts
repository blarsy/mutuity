import { Client } from "pg";

import { TEST_DATABASE_URL, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";
import { expireNeedsTask } from "../../src/worker/tasks/expire-needs";

jest.setTimeout(30000);

describe("worker bootstrap", () => {
  it("expires stale needs, closes linked open claims, and emits claimer notifications", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `worker-creator-${stamp}@example.com`,
      displayName: "Worker Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `worker-claimer-${stamp}@example.com`,
      displayName: "Worker Claimer"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `Expired Need ${stamp}`,
      expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "I was ready to help."
    });

    process.env.DATABASE_URL = TEST_DATABASE_URL;
    await expireNeedsTask({ nowIso: new Date().toISOString() }, {} as never);

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const needResult = await client.query<{ is_active: boolean }>(
        "select is_active from app_public.need where id = $1",
        [need.id]
      );
      const claimResult = await client.query<{ status: string }>(
        "select status::text from app_public.need_claim where id = $1",
        [claim.id]
      );
      const notificationResult = await client.query<{ event_type: string }>(
        "select event_type from app_public.need_claim_notification where need_claim_id = $1 order by created_at desc",
        [claim.id]
      );

      expect(needResult.rows[0]?.is_active).toBe(false);
      expect(claimResult.rows[0]?.status).toBe("expired");
      expect(notificationResult.rows.some(row => row.event_type === "claim_expired")).toBe(true);
    } finally {
      await client.end();
    }
  });
});
