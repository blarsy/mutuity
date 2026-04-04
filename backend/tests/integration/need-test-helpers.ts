import path from "node:path";

import { Client } from "pg";

import { loadSql } from "../../src/db/loadSql";
import { TEST_DATABASE_URL, seedDemoAccount, type SeededAccount } from "./auth-test-helpers";

const UPDATE_ACCOUNT_COORDINATES_SQL = loadSql(
  path.join(__dirname, "sql/need/update_account_coordinates.sql")
);
const INSERT_NEED_SQL = loadSql(path.join(__dirname, "sql/need/insert_need.sql"));
const INSERT_NEED_CLAIM_SQL = loadSql(path.join(__dirname, "sql/need/insert_need_claim.sql"));

export type SeededNeed = {
  id: string;
  creatorAccount: SeededAccount;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  expiresAt: string | null;
};

export type SeededNeedClaim = {
  id: string;
  needId: string;
  claimerAccountId: string;
  message: string | null;
  status: string;
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

export async function seedNeed(overrides?: {
  creatorAccount?: SeededAccount;
  title?: string;
  description?: string | null;
  location?: string;
  latitude?: number;
  longitude?: number;
  intensity?: "leg_up" | "sharing" | "commitment" | "rare_contribution";
  proposedTopesAmount?: number | null;
  objectRequired?: boolean;
  competenceRequired?: boolean;
  toolingRequired?: boolean;
  multiplePeopleRequired?: boolean;
  requiredCompetenceText?: string | null;
  requiredToolingText?: string | null;
  requiredPeopleCount?: number | null;
  isActive?: boolean;
  expiresAt?: string | null;
}) {
  const creatorAccount = overrides?.creatorAccount ?? (await seedDemoAccount());
  const title = overrides?.title ?? `Need ${Date.now()}`;
  const description = overrides?.description ?? "Seeded need for integration tests";
  const location = overrides?.location ?? "Tournai city centre";
  const latitude = overrides?.latitude ?? 50.6056;
  const longitude = overrides?.longitude ?? 3.3878;
  const intensity = overrides?.intensity ?? "sharing";
  const proposedTopesAmount = overrides?.proposedTopesAmount ?? 150;
  const objectRequired = overrides?.objectRequired ?? false;
  const competenceRequired = overrides?.competenceRequired ?? false;
  const toolingRequired = overrides?.toolingRequired ?? false;
  const multiplePeopleRequired = overrides?.multiplePeopleRequired ?? false;
  const requiredCompetenceText = overrides?.requiredCompetenceText ?? null;
  const requiredToolingText = overrides?.requiredToolingText ?? null;
  const requiredPeopleCount = overrides?.requiredPeopleCount ?? null;
  const isActive = overrides?.isActive ?? true;
  const expiresAt = overrides?.expiresAt ?? null;

  return withClient(async client => {
    await client.query(UPDATE_ACCOUNT_COORDINATES_SQL, [
      creatorAccount.accountId,
      latitude,
      longitude
    ]);

    const result = await client.query<{
      id: string;
      title: string;
      location: string;
      latitude: number;
      longitude: number;
      expires_at: string | null;
    }>(INSERT_NEED_SQL, [
      creatorAccount.accountId,
      title,
      description,
      location,
      latitude,
      longitude,
      intensity,
      proposedTopesAmount,
      objectRequired,
      competenceRequired,
      toolingRequired,
      multiplePeopleRequired,
      requiredCompetenceText,
      requiredToolingText,
      requiredPeopleCount,
      isActive,
      expiresAt
    ]);

    const row = result.rows[0];

    return {
      id: row.id,
      creatorAccount,
      title: row.title,
      location: row.location,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      expiresAt: row.expires_at
    } satisfies SeededNeed;
  });
}

export async function seedNeedClaim(overrides: {
  needId: string;
  claimerAccount?: SeededAccount;
  message?: string | null;
  status?: "open" | "settled" | "declined" | "withdrawn" | "expired";
}) {
  const claimerAccount = overrides.claimerAccount ?? (await seedDemoAccount({ identifier: `claimer-${Date.now()}@example.com` }));
  const message = overrides.message ?? "I can help with this.";
  const status = overrides.status ?? "open";

  return withClient(async client => {
    const result = await client.query<{
      id: string;
      need_id: string;
      claimer_account_id: string;
      message: string | null;
      status: string;
    }>(INSERT_NEED_CLAIM_SQL, [overrides.needId, claimerAccount.accountId, message, status]);

    return {
      id: result.rows[0].id,
      needId: result.rows[0].need_id,
      claimerAccountId: result.rows[0].claimer_account_id,
      message: result.rows[0].message,
      status: result.rows[0].status
    } satisfies SeededNeedClaim;
  });
}
