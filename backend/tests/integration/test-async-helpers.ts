export async function waitForResult<T>(
  producer: () => Promise<T | null | undefined>,
  options?: {
    timeoutMs?: number;
    pollMs?: number;
  }
): Promise<T | undefined> {
  const timeoutMs = options?.timeoutMs ?? 4000;
  const pollMs = options?.pollMs ?? 200;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const value = await producer();

    if (typeof value !== "undefined" && value !== null) {
      return value;
    }

    await new Promise(resolve => setTimeout(resolve, pollMs));
  }

  return undefined;
}

export function isTimestampWithinAge(timestampIso: string, timeoutMs: number): boolean {
  const ageMs = Date.now() - new Date(timestampIso).getTime();
  return ageMs >= 0 && ageMs <= timeoutMs;
}
