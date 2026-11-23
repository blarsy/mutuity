export type SiteDateTimeKind = "date" | "time" | "datetime";

/** Format a displayed date/time using the active website locale. */
export function formatSiteDateTime(
  value: string | Date | null | undefined,
  locale: string,
  kind: SiteDateTimeKind = "datetime"
) {
  if (value == null || value === "") return "";

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return typeof value === "string" ? value : "";

  const options: Intl.DateTimeFormatOptions = kind === "date"
    ? { year: "numeric", month: "2-digit", day: "2-digit" }
    : kind === "time"
      ? { hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };

  return new Intl.DateTimeFormat(locale || "en", options).format(date);
}

export function formatPublicDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(value));
}
