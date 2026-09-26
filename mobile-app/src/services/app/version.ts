export interface AppVersionStatus {
  currentVersion: string;
  minimumVersion: string;
  updateRequired: boolean;
}

/**
 * Fallback floor used only when the server cannot be reached and no floor has
 * been learned yet. The authoritative floor lives server-side
 * (`app_private.app_version_policy`, exposed via `/health`) so an already
 * shipped binary can be constrained by a future breaking backend change.
 */
export const MINIMUM_SUPPORTED_APP_VERSION = "0.1.0";

export function parseVersion(version: string): number[] {
  return version.split(".").map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

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

/**
 * Compares the running app version against a minimum. Passing the minimum as
 * a parameter (rather than reading a hardcoded constant) lets the server drive
 * the floor at runtime.
 */
export function getAppVersionStatus(
  currentVersion: string,
  minimumVersion: string = MINIMUM_SUPPORTED_APP_VERSION
): AppVersionStatus {
  const comparison = compareVersions(currentVersion, minimumVersion);

  return {
    currentVersion,
    minimumVersion,
    updateRequired: comparison < 0
  };
}
