import { logAppEvent } from "../monitoring/logger";

const connectedListeners = new Set<() => void>();

export function onRealtimeConnected(callback: () => void): () => void {
  connectedListeners.add(callback);
  return () => { connectedListeners.delete(callback); };
}

// Kept independent of Apollo and auth to avoid provider/service import cycles.
export function notifyRealtimeConnected(): void {
  for (const callback of [...connectedListeners]) {
    try {
      callback();
    } catch (error) {
      logAppEvent({ level: "error", message: "graphql-realtime-listener-error", details: error });
    }
  }
}