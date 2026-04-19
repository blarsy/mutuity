import path from "node:path";

import { hash } from "bcryptjs";
import { Client } from "pg";

import { loadSql } from "../../src/db/loadSql";

const UPSERT_ACCOUNT_SQL = loadSql(path.join(__dirname, "sql/auth/upsert_account.sql"));
const UPSERT_ACCOUNT_CREDENTIAL_SQL = loadSql(
  path.join(__dirname, "sql/auth/upsert_account_credential.sql")
);
const DELETE_ACCOUNT_SESSIONS_SQL = loadSql(
  path.join(__dirname, "sql/auth/delete_account_sessions.sql")
);
const EXPIRE_ACCOUNT_SESSIONS_SQL = loadSql(
  path.join(__dirname, "sql/auth/expire_account_sessions.sql")
);

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mutuity";
export const TEST_BACKEND_URL = process.env.TEST_BACKEND_URL ?? "http://localhost:5050";

export type SeededAccount = {
  accountId: string;
  identifier: string;
  password: string;
  role: string;
  displayName: string;
};

async function withClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString: TEST_DATABASE_URL
  });

  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

export async function seedDemoAccount(overrides?: Partial<Omit<SeededAccount, "accountId">>) {
  const identifier = overrides?.identifier ?? "demo@example.com";
  const password = overrides?.password ?? "password123";
  const role = overrides?.role ?? "identified_account";
  const displayName = overrides?.displayName ?? "Demo User";
  const passwordHash = await hash(password, 12);

  return withClient(async client => {
    const accountResult = await client.query<{ id: string }>(UPSERT_ACCOUNT_SQL, [
      identifier,
      displayName
    ]);

    const accountId = accountResult.rows[0].id;

    await client.query(UPSERT_ACCOUNT_CREDENTIAL_SQL, [accountId, identifier, passwordHash, role]);

    await client.query(DELETE_ACCOUNT_SESSIONS_SQL, [accountId]);

    return {
      accountId,
      identifier,
      password,
      role,
      displayName
    } satisfies SeededAccount;
  });
}

export async function expireSessionsForAccount(accountId: string) {
  return withClient(async client => {
    await client.query(EXPIRE_ACCOUNT_SESSIONS_SQL, [accountId]);
  });
}

export function getSessionCookie(response: Response) {
  const setCookieHeader = response.headers.get("set-cookie");

  if (!setCookieHeader) {
    throw new Error("Expected a session cookie in the response.");
  }

  return setCookieHeader.split(";")[0];
}

export async function loginWithGraphql(identifier: string, password: string) {
  return fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        mutation AuthLogin($identifier: String!, $password: String!) {
          authLogin(input: { identifier: $identifier, password: $password }) {
            authSession {
              authenticated
            }
          }
        }
      `,
      variables: {
        identifier,
        password
      }
    })
  });
}

export async function loginWithGraphqlSessionCookie(identifier: string, password: string) {
  const response = await loginWithGraphql(identifier, password);

  if (response.status !== 200) {
    throw new Error(`GraphQL login failed with status ${response.status}`);
  }

  return getSessionCookie(response);
}
