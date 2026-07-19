import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enUs1 from "./locales/en/us1.json";
import frCommon from "./locales/fr/common.json";
import frUs1 from "./locales/fr/us1.json";

const resources = {
  en: {
    common: enCommon,
    us1: enUs1
  },
  fr: {
    common: frCommon,
    us1: frUs1
  }
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "us1"],
  interpolation: {
    escapeValue: false
  },
  compatibilityJSON: "v4"
});

export default i18n;
