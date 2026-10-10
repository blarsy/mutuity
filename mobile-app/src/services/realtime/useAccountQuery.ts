import { useCallback, useEffect, useRef, useState } from "react";
import { useAccountEventSignal } from "./accountEvents";

/** Keep the last good value during refresh, serialize requests, and reject stale identities. */
export function useAccountQuery(accountId: string | null, enabled: boolean, fetchValue: () => Promise<number>) {
  const [state, setState] = useState<{ accountId: string | null; value: number | null; loading: boolean; error: unknown }>({
    accountId: null, value: null, loading: false, error: null
  });
  const fetchRef = useRef(fetchValue);
  fetchRef.current = fetchValue;
  const generation = useRef(0);
  const runner = useRef<(() => Promise<void>) | null>(null);
  const refresh = useCallback(async () => { await runner.current?.(); }, []);
  useEffect(() => {
    const expected = ++generation.current;
    setState({ accountId, value: null, loading: Boolean(accountId && enabled), error: null });
    if (!accountId || !enabled) { runner.current = null; return; }
    let inFlight: Promise<void> | null = null;
    let again = false;
    const run = (): Promise<void> => {
      if (inFlight) { again = true; return inFlight; }
      inFlight = (async () => {
        do {
          again = false;
          try {
            const value = await fetchRef.current();
            if (generation.current === expected) setState({ accountId, value, loading: false, error: null });
          } catch (error) {
            if (generation.current === expected) setState(previous => ({ ...previous, loading: false, error }));
          }
        } while (again && generation.current === expected);
      })().finally(() => { inFlight = null; });
      return inFlight;
    };
    runner.current = run;
    void run();
    return () => { generation.current += 1; runner.current = null; };
  }, [accountId, enabled]);
  useAccountEventSignal(refresh, Boolean(accountId && enabled));
  const visible = state.accountId === accountId && enabled;
  return { value: visible ? state.value : null, loading: visible ? state.loading : false, error: visible ? state.error : null, refresh };
}