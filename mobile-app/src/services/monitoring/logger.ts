export interface AppLogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  details?: unknown;
}

export function logAppEvent(entry: AppLogEntry): void {
  const prefix = `[mobile:${entry.level}]`;

  if (entry.level === "error") {
    console.error(prefix, entry.message, entry.details ?? "");
    return;
  }

  if (entry.level === "warn") {
    console.warn(prefix, entry.message, entry.details ?? "");
    return;
  }

  if (entry.level === "debug") {
    console.debug(prefix, entry.message, entry.details ?? "");
    return;
  }

  console.info(prefix, entry.message, entry.details ?? "");
}
