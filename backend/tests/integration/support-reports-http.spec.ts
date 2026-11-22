import { randomUUID } from "node:crypto";
import { Client } from "pg";

import { loginWithGraphqlSessionCookie, seedDemoAccount } from "./auth-test-helpers";

// Requires a running disposable/local backend and its owner database.
const describeHttp = process.env.TEST_DATABASE_URL && process.env.TEST_BACKEND_URL ? describe : describe.skip;
jest.setTimeout(30000);

describeHttp("support report HTTP integration", () => {
  it("files a report, shows it only to admins, and delivers an admin inbox notification", async () => {
    const tag = `support-http-${randomUUID()}`;
    const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await db.connect();
    let userId = "";
    let adminId = "";
    let reportId = "";
    const request = async (query: string, variables: Record<string, unknown>, cookie?: string) => {
      const response = await fetch(`${process.env.TEST_BACKEND_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify({ query, variables })
      });
      expect(response.status).toBe(200);
      return await response.json() as { data?: Record<string, any>; errors?: unknown[] };
    };
    try {
      const user = await seedDemoAccount({ identifier: `${tag}-user@example.com`, displayName: tag });
      userId = user.accountId;
      const admin = await seedDemoAccount({ identifier: `${tag}-admin@example.com`, role: "admin", displayName: tag });
      adminId = admin.accountId;
      const userCookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
      const adminCookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);
      const mutation = `mutation($input: SubmitSupportReportInput!) { submitSupportReport(input:$input) { uuid } }`;
      const input = { pSummary: tag, pDescription: "private details", pDiagnostics: { platform: "ios" } };
      const anonymous = await request(mutation, { input });
      expect(anonymous.errors).toBeDefined();
      const filed = await request(mutation, { input }, userCookie);
      expect(filed.errors).toBeUndefined();
      reportId = filed.data?.submitSupportReport?.uuid;
      expect(reportId).toMatch(/^[a-f0-9-]{36}$/);

      const listing = `query($s:String) { adminListSupportReports(pSearch:$s,pLimit:25,pOffset:0) { nodes { id summary description diagnostics accountId } } }`;
      const forbidden = await request(listing, { s: tag }, userCookie);
      expect(forbidden.errors).toBeDefined();
      const reports = await request(listing, { s: tag }, adminCookie);
      expect(reports.errors).toBeUndefined();
      expect(reports.data?.adminListSupportReports.nodes).toEqual([expect.objectContaining({
        id: reportId, summary: tag, description: "private details", diagnostics: { platform: "ios" }, accountId: userId
      })]);

      const inbox = await request(`query { allAccountNotifications { nodes { eventType payload } } }`, {}, adminCookie);
      expect(inbox.errors).toBeUndefined();
      expect(inbox.data?.allAccountNotifications.nodes).toContainEqual(expect.objectContaining({
        eventType: "support_report_created", payload: { reportId }
      }));
    } finally {
      if (reportId) {
        await db.query("delete from app_public.account_notification where event_type='support_report_created' and payload->>'reportId'=$1", [reportId]);
        await db.query("delete from app_private.support_report where id=$1", [reportId]);
      }
      if (userId || adminId) await db.query("delete from app_public.account where id=any($1::uuid[])", [[userId, adminId].filter(Boolean)]);
      await db.end();
    }
  });
});