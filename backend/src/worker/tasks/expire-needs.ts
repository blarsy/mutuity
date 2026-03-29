import type { Task } from "graphile-worker";

type ExpireNeedsPayload = {
  nowIso?: string;
};

// Placeholder recurring task; real logic will be implemented in Feature 2/3.
export const expireNeedsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as ExpireNeedsPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  console.log(`[worker] expire_needs tick at ${now.toISOString()}`);
};
