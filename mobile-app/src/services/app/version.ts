export interface AppVersionStatus {
  currentVersion: string;
  minimumVersion: string;
  updateRequired: boolean;
}

export const MINIMUM_SUPPORTED_APP_VERSION = "0.1.0";

function parseVersion(version: string): number[] {
  return version.split(".").map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

function compareVersions(a: string, b: string): number {
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

export function getAppVersionStatus(currentVersion: string): AppVersionStatus {
  const comparison = compareVersions(currentVersion, MINIMUM_SUPPORTED_APP_VERSION);

  return {
    currentVersion,
    minimumVersion: MINIMUM_SUPPORTED_APP_VERSION,
    updateRequired: comparison < 0
  };
}
