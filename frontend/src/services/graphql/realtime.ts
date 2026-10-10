const connectedListeners = new Set<() => void>();

export function onRealtimeConnected(listener: () => void) {
  connectedListeners.add(listener);
  return () => { connectedListeners.delete(listener); };
}

export function notifyRealtimeConnected() {
  for (const listener of connectedListeners) listener();
}

export function reportRealtimeError(error: unknown) {
  console.error("[realtime] Subscription or refresh failed", error);
}

/** Catch both synchronous failures and returned refetch promises. */
export function handleRealtimeRefresh(refresh: () => unknown) {
  try {
    void Promise.resolve(refresh()).catch(reportRealtimeError);
  } catch (error) {
    reportRealtimeError(error);
  }
}