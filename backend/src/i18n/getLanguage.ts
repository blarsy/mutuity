import type { IncomingMessage } from "http";

export function getLanguage(req: IncomingMessage): string {
  if (!req) {
    return "en";
  }

  // 1. Auth session preferred language
  const session = (req as any).authSession as { preferredLanguage?: string } | null;
  if (session?.preferredLanguage) {
    return session.preferredLanguage;
  }

  // 2. UI‑selected language (custom header sent by the frontend)
  const uiLang = req.headers["x-selected-language"] as string | undefined;
  if (uiLang) {
    const lang = uiLang.trim().slice(0, 2).toLowerCase();
    if (lang === "fr" || lang === "en") {
      return lang;
    }
  }

  // 3. Accept-Language header
  const acceptLang = req.headers["accept-language"];
  if (acceptLang) {
    const primary = acceptLang.split(",")[0]?.trim()?.slice(0, 2);
    if (primary?.toLowerCase() === "fr") {
      return "fr";
    }
  }

  // 4. Default
  return "en";
}
