import { logAppEvent } from "./logger";

export interface ActivityCorrelationContext {
  screenName: string;
  actionName: string;
  correlationId?: string;
}

export function trackActivity(context: ActivityCorrelationContext): string {
  const correlationId = context.correlationId ?? `activity-${Date.now()}`;

  logAppEvent({
    level: "info",
    message: "activity-tracked",
    details: {
      ...context,
      correlationId
    }
  });

  return correlationId;
}
