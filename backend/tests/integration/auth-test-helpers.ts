import { hash } from "bcryptjs";
import { Client } from "pg";

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
    const accountResult = await client.query<{ id: string }>(
      `
        insert into app_public.account (external_subject, display_name)
        values ($1, $2)
        on conflict (external_subject) do update
        set display_name = excluded.display_name,
            updated_at = now()
        returning id
      `,
      [identifier, displayName]
    );

    const accountId = accountResult.rows[0].id;

    await client.query(
      `
        insert into app_private.account_credential (
          account_id,
          login_identifier,
          password_hash,
          role_name,
          is_active
        )
        values ($1, $2, $3, $4, true)
        on conflict (account_id) do update
        set login_identifier = excluded.login_identifier,
            password_hash = excluded.password_hash,
            role_name = excluded.role_name,
            is_active = excluded.is_active,
            updated_at = now()
      `,
      [accountId, identifier, passwordHash, role]
    );

    await client.query(
      `
        delete from app_private.account_session
        where account_id = $1
      `,
      [accountId]
    );

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
    await client.query(
      `
        update app_private.account_session
        set expires_at = now() - interval '1 minute'
        where account_id = $1
          and revoked_at is null
      `,
      [accountId]
    );
  });
}

export function getSessionCookie(response: Response) {
  const setCookieHeader = response.headers.get("set-cookie");

  if (!setCookieHeader) {
    throw new Error("Expected a session cookie in the response.");
  }

  return setCookieHeader.split(";")[0];
}
