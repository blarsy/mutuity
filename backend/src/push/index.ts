export type OutboundPushNotification = {
  to: string;
  eventCategory: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  priority: "high";
};

function isTruthyEnv(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isPushDeliveryEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (typeof process.env.PUSH_DELIVERY_ENABLED === "string") {
    return isTruthyEnv(process.env.PUSH_DELIVERY_ENABLED);
  }

  return false;
}

export async function sendLivePushNotification(notification: OutboundPushNotification) {
  const endpoint = process.env.PUSH_DELIVERY_ENDPOINT ?? "https://exp.host/--/api/v2/push/send";

  const messages: ExpoPushMessage[] = [
    {
      to: notification.to,
      title: notification.title,
      body: notification.body,
      data: {
        eventCategory: notification.eventCategory,
        ...notification.metadata
      },
      priority: "high"
    }
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    throw new Error(`Push delivery failed with status ${response.status}`);
  }

  return response.json() as Promise<{ id?: string }>;
}