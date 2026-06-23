const APP_SHELL_SEGMENTS = new Set([
  "needs",
  "resources",
  "campaigns",
  "accounts",
  "admin",
  "grants",
  "notifications",
  "chat",
  "claims",
  "bids",
  "contribution",
  "preferences",
  "profile",
  "change-password"
]);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveAppPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("/app/")) {
    return path;
  }

  const [, segment = ""] = path.split("/");
  if (APP_SHELL_SEGMENTS.has(segment)) {
    return `/app${path}`;
  }

  return path;
}

export function urlRegexForPath(path: string): RegExp {
  const resolved = resolveAppPath(path);
  const resolvedPattern = escapeRegex(resolved);

  if (resolved === path) {
    return new RegExp(`${resolvedPattern}(\\?.*)?$`);
  }

  const legacyPattern = escapeRegex(path);
  return new RegExp(`(?:${legacyPattern}|${resolvedPattern})(\\?.*)?$`);
}
