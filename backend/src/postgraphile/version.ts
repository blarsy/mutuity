import type { Pool } from "pg";

export type AppPlatform = "ios" | "android";

export interface AppVersionFloor {
  minIosSemver: string;
  minAndroidSemver: string;
}

const DEFAULT_FLOOR: AppVersionFloor = {
  minIosSemver: "0.0.0",
  minAndroidSemver: "0.0.0"
};

// Cache the floor to avoid a database round-trip on every request. The floor
// only changes when the app_version_policy row is updated (a release event),
// so a short TTL is more than enough.
let cachedFloor: AppVersionFloor | null = null;
let cachedFloorAt = 0;
const FLOOR_CACHE_TTL_MS = 30_000;

function parseVersion(version: string): number[] {
  return version.split(".").map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

/** Returns 1 if a > b, -1 if a < b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;

    if (aPart > bPart) {
      return 1;
    }

    if (aPart < bPart) {
      return -1;
    }
  }

  return 0;
}

export async function getAppVersionFloor(pool: Pool): Promise<AppVersionFloor> {
  const now = Date.now();

  if (cachedFloor && now - cachedFloorAt < FLOOR_CACHE_TTL_MS) {
    return cachedFloor;
  }

  try {
    const { rows } = await pool.query<AppVersionFloor>(
      `select min_ios_semver as "minIosSemver",
              min_android_semver as "minAndroidSemver"
       from app_private.app_version_policy
       where id = true`
    );

    cachedFloor = rows[0] ?? DEFAULT_FLOOR;
    cachedFloorAt = now;
    return cachedFloor;
  } catch {
    // The policy table may not exist yet on a fresh/partial database. Falling
    // back to the default floor keeps bootstrapping and non-versioned clients
    // (web, tooling) working.
    return DEFAULT_FLOOR;
  }
}

/**
 * Returns true when the reported app version is below the floor for its
 * platform (i.e. this client MUST update). Unknown platforms or missing
 * versions are not enforced (returns false) so the web client and internal
 * tooling that don't send app headers are unaffected.
 */
export function isVersionBelowFloor(
  version: string,
  platform: AppPlatform | null,
  floor: AppVersionFloor
): boolean {
  if (!platform || !version) {
    return false;
  }

  const minimum = platform === "android" ? floor.minAndroidSemver : floor.minIosSemver;
  return compareVersions(version, minimum) < 0;
}