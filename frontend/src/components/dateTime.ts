import { format, isValid, parseISO } from "date-fns";

export const INVALID_DATE_TIME = "invalid-date-time";

/** Local wall-clock values for form state; convert to UTC only on submission. */
export function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

export function isValidDateTimeLocalValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    && toDateTimeLocalValue(value) === value;
}