import * as SecureStore from "expo-secure-store";

const TOKEN_STORAGE_KEY = "mutuity.auth.token";

let fallbackToken: string | null = null;

async function canUseSecureStore(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getPersistedToken(): Promise<string | null> {
  if (await canUseSecureStore()) {
    const storedToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    return storedToken ?? null;
  }

  return fallbackToken;
}

export async function setPersistedToken(token: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    return;
  }

  fallbackToken = token;
}

export async function clearPersistedToken(): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    return;
  }

  fallbackToken = null;
}

export async function bootstrapSession(): Promise<{ token: string | null }> {
  const token = await getPersistedToken();
  return { token };
}
