import * as SecureStore from "expo-secure-store";

const TOKEN_STORAGE_KEY = "mutuity.auth.token";
const ACCOUNT_ID_STORAGE_KEY = "mutuity.auth.accountId";
const LANGUAGE_STORAGE_KEY = "mutuity.auth.language";
const SECURE_STORE_TIMEOUT_MS = 1500;

let fallbackToken: string | null = null;
let fallbackAccountId: string | null = null;
let fallbackLanguage: string | null = null;

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

export async function getPersistedAccountId(): Promise<string | null> {
  if (await canUseSecureStore()) {
    const storedAccountId = await withTimeout(SecureStore.getItemAsync(ACCOUNT_ID_STORAGE_KEY), fallbackAccountId);
    return storedAccountId ?? null;
  }

  return fallbackAccountId;
}

export async function setPersistedAccountId(accountId: string | null): Promise<void> {
  fallbackAccountId = accountId;

  if (await canUseSecureStore()) {
    if (accountId) {
      await withTimeout(SecureStore.setItemAsync(ACCOUNT_ID_STORAGE_KEY, accountId), undefined);
      return;
    }

    await withTimeout(SecureStore.deleteItemAsync(ACCOUNT_ID_STORAGE_KEY), undefined);
  }
}

export async function clearPersistedToken(): Promise<void> {
  fallbackToken = null;
  fallbackAccountId = null;

  if (await canUseSecureStore()) {
    await withTimeout(SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY), undefined);
    await withTimeout(SecureStore.deleteItemAsync(ACCOUNT_ID_STORAGE_KEY), undefined);
    return;
  }
}

export async function getPersistedLanguage(): Promise<string | null> {
  if (await canUseSecureStore()) {
    const storedLanguage = await withTimeout(SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY), fallbackLanguage);
    return storedLanguage ?? null;
  }

  return fallbackLanguage;
}

export async function setPersistedLanguage(language: string): Promise<void> {
  fallbackLanguage = language;

  if (await canUseSecureStore()) {
    await withTimeout(SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language), undefined);
    return;
  }
}

export async function bootstrapSession(): Promise<{ token: string | null; accountId: string | null; language: string | null }> {
  const [token, accountId, language] = await Promise.all([getPersistedToken(), getPersistedAccountId(), getPersistedLanguage()]);
  return { token, accountId, language };
}
