export interface PushBootstrapResult {
  permissionStatus: "granted" | "denied" | "undetermined";
  token: string | null;
}

export async function bootstrapPushPermissions(): Promise<PushBootstrapResult> {
  return {
    permissionStatus: "undetermined",
    token: null
  };
}

export async function syncPushToken(token: string | null): Promise<void> {
  void token;
}
