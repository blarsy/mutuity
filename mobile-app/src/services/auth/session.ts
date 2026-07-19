import * as SecureStore from "expo-secure-store";

const TOKEN_STORAGE_KEY = "mutuity.auth.token";
const SECURE_STORE_TIMEOUT_MS = 1500;

let fallbackToken: string | null = null;

function withTimeout<T>(promise: Promise<T>, fallbackValue: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallbackValue);
      }
    }, SECURE_STORE_TIMEOUT_MS);

    void promise
      .then((value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallbackValue);
        }
      });
  });
}

async function canUseSecureStore(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getPersistedToken(): Promise<string | null> {
  if (await canUseSecureStore()) {
    const storedToken = await withTimeout(SecureStore.getItemAsync(TOKEN_STORAGE_KEY), fallbackToken);
    return storedToken ?? null;
  }

  return fallbackToken;
}

export async function setPersistedToken(token: string): Promise<void> {
  fallbackToken = token;

  if (await canUseSecureStore()) {
    await withTimeout(SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token), undefined);
    return;
  }
}

export async function clearPersistedToken(): Promise<void> {
  fallbackToken = null;

  if (await canUseSecureStore()) {
    await withTimeout(SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY), undefined);
    return;
  }
}

export async function bootstrapSession(): Promise<{ token: string | null }> {
  const token = await getPersistedToken();
  return { token };
}
