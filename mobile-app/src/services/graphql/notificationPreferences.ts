export interface NotificationPreferenceRecord {
  eventCategory: string;
  deliveryMode: "realtime" | "summary";
}

const notificationPreferences: NotificationPreferenceRecord[] = [];

export function getNotificationPreferences(): NotificationPreferenceRecord[] {
  return [...notificationPreferences];
}

export function setNotificationPreference(preference: NotificationPreferenceRecord): void {
  const existingIndex = notificationPreferences.findIndex((item) => item.eventCategory === preference.eventCategory);

  if (existingIndex >= 0) {
    notificationPreferences[existingIndex] = preference;
    return;
  }

  notificationPreferences.push(preference);
}
