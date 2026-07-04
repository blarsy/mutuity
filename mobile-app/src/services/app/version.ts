export interface AppVersionStatus {
  currentVersion: string;
  minimumVersion: string;
  updateRequired: boolean;
}

export const MINIMUM_SUPPORTED_APP_VERSION = "0.1.0";

export function getAppVersionStatus(currentVersion: string): AppVersionStatus {
  return {
    currentVersion,
    minimumVersion: MINIMUM_SUPPORTED_APP_VERSION,
    updateRequired: currentVersion < MINIMUM_SUPPORTED_APP_VERSION
  };
}
