import i18next from "i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

i18next.init({
  resources: {
    en: { translation: en },
    fr: { translation: fr }
  },
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export function translate(key: string, language: string, vars?: Record<string, unknown>) {
  return i18next.t(key, { lng: language, ...vars });
}