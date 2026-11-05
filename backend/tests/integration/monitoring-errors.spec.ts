jest.mock("../../src/monitoring/instrument", () => ({ captureUnexpectedError: jest.fn() }));

import { captureUnexpectedError } from "../../src/monitoring/instrument";
import { reportExpressError, reportGraphqlError } from "../../src/monitoring/errors";
import { monitorTasks } from "../../src/worker/monitorTasks";

beforeEach(() => jest.clearAllMocks());

it("reports unexpected Express errors, skips expected 4xx and always preserves next(error)", () => {
  const next = jest.fn();
  const expected = Object.assign(new Error("invalid body"), { status: 400 });
  reportExpressError(expected, {} as never, {} as never, next);
  expect(captureUnexpectedError).not.toHaveBeenCalled();
  expect(next).toHaveBeenLastCalledWith(expected);
  const unexpected = new TypeError("fault");
  reportExpressError(unexpected, {} as never, {} as never, next);
  expect(captureUnexpectedError).toHaveBeenCalledWith(unexpected);
  expect(next).toHaveBeenLastCalledWith(unexpected);
});

it("reports unexpected GraphQL resolver failures, not expected domain/database/input errors", () => {
  for (const code of ["BAD_USER_INPUT", "FORBIDDEN", "UNAUTHENTICATED", "RATE_LIMITED", "NOT_FOUND"]) {
    reportGraphqlError({ originalError: new Error("domain") }, code);
  }
  reportGraphqlError({}, "INTERNAL_SERVER_ERROR");
  for (const code of ["23505", "22023", "42501", "P0001"]) {
    reportGraphqlError({ originalError: Object.assign(new Error("expected"), { code }) }, "INTERNAL_SERVER_ERROR");
  }
  expect(captureUnexpectedError).not.toHaveBeenCalled();
  const unexpected = new TypeError("resolver fault");
  reportGraphqlError({ originalError: unexpected }, "INTERNAL_SERVER_ERROR");
  expect(captureUnexpectedError).toHaveBeenCalledWith(unexpected);
});

it("captures a task failure once without payload and rethrows for retries", async () => {
  const error = new Error("job failure");
  const task = jest.fn().mockRejectedValue(error);
  const payload = { session: "secret", chat: "private" };
  const tasks = monitorTasks({ task });
  await expect(tasks.task!(payload, {} as never)).rejects.toBe(error);
  expect(task).toHaveBeenCalledWith(payload, {});
  expect(captureUnexpectedError).toHaveBeenCalledTimes(1);
  expect(captureUnexpectedError).toHaveBeenCalledWith(error);
});