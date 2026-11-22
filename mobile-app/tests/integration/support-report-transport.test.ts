import { buildSchema, graphql } from "graphql";

import { submitIssueReport } from "../../src/services/support/reportIssue";

jest.mock("../../src/services/auth/session", () => ({
  getPersistedToken: jest.fn(async () => "opaque-session-token"),
  getPersistedAccountId: jest.fn(async () => null)
}));

// Models the expected default PostGraphile schema; this is not live introspection.
const schema = buildSchema(`
  scalar JSON
  scalar UUID
  input SubmitSupportReportInput { pSummary: String, pDescription: String, pDiagnostics: JSON }
  type SubmitSupportReportPayload { uuid: UUID }
  type Query { unused: Boolean }
  type Mutation { submitSupportReport(input: SubmitSupportReportInput!): SubmitSupportReportPayload }
`);
const id = "12345678-1234-1234-1234-123456789abc";
const originalFetch = global.fetch;

afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

it("sends the operation and bearer session through the shared Apollo HTTP link", async () => {
  const resolver = jest.fn((_args: { input: unknown }) => ({ uuid: id }));
  const fetchMock = jest.fn(async (_url: string, init: { body: string; headers: Record<string, string> }) => {
    const request = JSON.parse(init.body);
    const result = await graphql({ schema, source: request.query, variableValues: request.variables, rootValue: { submitSupportReport: resolver } });
    return { ok: true, status: 200, headers: { get: () => "application/json" }, text: async () => JSON.stringify(result) };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, "debug").mockImplementation(() => undefined);
  await expect(submitIssueReport({ summary: "Help", appVersion: "1.2", buildNumber: "42" })).resolves.toBe(id);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [, init] = fetchMock.mock.calls[0]!;
  expect(init.headers.authorization).toBe("Bearer opaque-session-token");
  expect(resolver).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({
    pSummary: "Help", pDescription: null,
    pDiagnostics: expect.objectContaining({ appVersion: "1.2", buildNumber: "42" })
  }) }), undefined, expect.anything());
});