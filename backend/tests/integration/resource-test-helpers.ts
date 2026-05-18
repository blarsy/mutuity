import path from "node:path";

import { Client } from "pg";

import { loadSql } from "../../src/db/loadSql";
import { TEST_DATABASE_URL, seedDemoAccount, type SeededAccount } from "./auth-test-helpers";

const UPDATE_ACCOUNT_COORDINATES_SQL = loadSql(
  path.join(__dirname, "sql/need/update_account_coordinates.sql")
);
const INSERT_RESOURCE_SQL = loadSql(path.join(__dirname, "sql/resource/insert_resource.sql"));

export type SeededResource = {
  id: string;
  creatorAccount: SeededAccount;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  expiresAt: string | null;
  isActive: boolean;
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

export async function seedResource(overrides?: {
  creatorAccount?: SeededAccount;
  title?: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  intensity?: "leg_up" | "sharing" | "commitment" | "rare_contribution";
  defaultTokenAmount?: number | null;
  isProduct?: boolean;
  isService?: boolean;
  canBeGiven?: boolean;
  canBeExchanged?: boolean;
  canBeTakenAway?: boolean;
  canBeDelivered?: boolean;
  isActive?: boolean;
  expiresAt?: string | null;
  categoryCodes?: number[];
}) {
  const creatorAccount = overrides?.creatorAccount ?? (await seedDemoAccount());
  const title = overrides?.title ?? `Resource ${Date.now()}`;
  const description = overrides?.description ?? "Seeded resource for integration tests";
  const location = overrides?.location ?? "Tournai city centre";
  
  // Handle null explicitly vs. undefined for defaults
  const latitude = overrides && "latitude" in overrides ? overrides.latitude : 50.6056;
  const longitude = overrides && "longitude" in overrides ? overrides.longitude : 3.3878;
  
  const intensity = overrides?.intensity ?? "sharing";
  const defaultTokenAmount = overrides?.defaultTokenAmount ?? null;
  const isProduct = overrides?.isProduct ?? true;
  const isService = overrides?.isService ?? false;
  const canBeGiven = overrides?.canBeGiven ?? false;
  const canBeExchanged = overrides?.canBeExchanged ?? true;
  const canBeTakenAway = overrides?.canBeTakenAway ?? true;
  const canBeDelivered = overrides?.canBeDelivered ?? false;
  const isActive = overrides?.isActive ?? true;
  const expiresAt = overrides?.expiresAt ?? null;
  const categoryCodes = overrides?.categoryCodes ?? [];

  return withClient(async client => {
    // Only update account coordinates if latitude and longitude are not both null
    if (latitude !== null && longitude !== null) {
      await client.query(UPDATE_ACCOUNT_COORDINATES_SQL, [
        creatorAccount.accountId,
        latitude,
        longitude
      ]);
    }

    const result = await client.query<{
      id: string;
      title: string;
      location: string | null;
      latitude: number | null;
      longitude: number | null;
      expires_at: string | null;
      is_active: boolean;
    }>(INSERT_RESOURCE_SQL, [
      creatorAccount.accountId,
      title,
      description,
      location,
      latitude,
      longitude,
      intensity,
      defaultTokenAmount,
      isProduct,
      isService,
      canBeGiven,
      canBeExchanged,
      canBeTakenAway,
      canBeDelivered,
      isActive,
      expiresAt
    ]);

    const row = result.rows[0];

    if (categoryCodes.length > 0) {
      await client.query(
        `
          insert into app_public.resource_category_assignment (resource_id, category_code)
          select $1::uuid, requested_code
          from unnest($2::int[]) as requested_code
          on conflict do nothing
        `,
        [row.id, categoryCodes]
      );
    }

    return {
      id: row.id,
      creatorAccount,
      title: row.title,
      location: row.location,
      latitude: row.latitude !== null ? Number(row.latitude) : null,
      longitude: row.longitude !== null ? Number(row.longitude) : null,
      expiresAt: row.expires_at,
      isActive: row.is_active
    } satisfies SeededResource;
  });
}
