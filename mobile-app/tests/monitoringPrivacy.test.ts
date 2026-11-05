import type { ErrorEvent, TransactionEvent } from "@sentry/react-native";
import { safeLogCode, sanitizeErrorEvent, sanitizeTransactionEvent } from "../src/services/monitoring/privacy";

describe("mobile monitoring privacy boundary", () => {
  const secret = "PRIVATE_CHAT_TOKEN_EMAIL";

  it("drops arbitrary payloads, exception messages, chained error data, source and local variables", () => {
    const event: ErrorEvent = {
      type: undefined,
      event_id: "123", release: "com.topela@1.0.7+182", dist: "182", environment: "review",
      message: secret, logentry: { message: secret },
      request: { url: `https://api.example.com/graphql?token=${secret}`, headers: { authorization: secret }, data: secret },
      user: { id: secret, email: secret },
      breadcrumbs: [{ message: secret, data: { variables: { body: secret } } }],
      extra: { variables: secret, chat: { body: secret } },
      contexts: { app: { data: secret } }, tags: { accountId: secret, mobile_error_code: "graphql-error" },
      exception: { values: [{ type: "TypeError", value: secret,
        mechanism: { type: secret, handled: false, data: { body: secret } },
        stacktrace: { frames: [{
          filename: `/Users/${secret}/main.js?token=${secret}`, abs_path: `https://host/main.js#${secret}`,
          function: "sendMessage", lineno: 42, colno: 8, in_app: true,
          pre_context: [secret], context_line: secret, vars: { chat: secret }
        }] }
      }] },
      debug_meta: { images: [{ type: "sourcemap", debug_id: "debug-id", code_file: `/private/${secret}/main.js?${secret}` }] }
    };
    const safe = sanitizeErrorEvent(event);
    expect(JSON.stringify(safe)).not.toContain(secret);
    expect(safe).toMatchObject({
      release: event.release, dist: "182", environment: "review",
      exception: { values: [{ type: "TypeError", value: "[Redacted error message]",
        mechanism: { type: "unhandled", handled: false },
        stacktrace: { frames: [{ filename: "main.js", lineno: 42, colno: 8 }] }
      }] },
      tags: { mobile_error_code: "graphql-error" }
    });
    expect(event.message).toBe(secret);
    expect(sanitizeErrorEvent({ type: undefined, message: secret })).not.toHaveProperty("message");
  });

  it("allows only static logger codes, not user-provided messages or custom error names", () => {
    expect(safeLogCode(secret)).toBe("mobile-error");
    expect(safeLogCode("auth-persist-token-failed")).toBe("auth-persist-token-failed");
    expect(sanitizeErrorEvent({ type: undefined, exception: { values: [{ type: secret, value: secret }] } })
      .exception?.values?.[0]?.type).toBe("Error");
  });

  it("retains navigation timing and trace linkage but no route params, HTTP spans or GraphQL variables", () => {
    const event: TransactionEvent = {
      type: "transaction", transaction: "Chat", start_timestamp: 10, timestamp: 12,
      request: { data: secret }, extra: { route: { params: { chat: secret } } },
      contexts: { trace: { trace_id: "a".repeat(32), span_id: "b".repeat(16), data: { variables: secret } } },
      spans: [{ trace_id: "a".repeat(32), span_id: "c".repeat(16), start_timestamp: 10, timestamp: 11, description: secret, data: { variables: secret } }]
    };
    const safe = sanitizeTransactionEvent(event);
    expect(JSON.stringify(safe)).not.toContain(secret);
    expect(safe).toMatchObject({ transaction: "Chat", start_timestamp: 10, timestamp: 12, spans: [] });
    expect(safe.contexts?.trace?.trace_id).toBe("a".repeat(32));
    expect(sanitizeTransactionEvent({ ...event, transaction: secret }).transaction).toBe("mobile.navigation");
  });
});