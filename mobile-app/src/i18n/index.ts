import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enUs1 from "./locales/en/us1.json";
import enUs2 from "./locales/en/us2.json";
import enUs3 from "./locales/en/us3.json";
import enUs4 from "./locales/en/us4.json";
import frCommon from "./locales/fr/common.json";
import frUs1 from "./locales/fr/us1.json";
import frUs2 from "./locales/fr/us2.json";
import frUs3 from "./locales/fr/us3.json";
import frUs4 from "./locales/fr/us4.json";

const resources = {
  en: {
    common: enCommon,
    us1: enUs1,
    us2: enUs2,
    us3: enUs3,
    us4: enUs4
  },
  fr: {
    common: frCommon,
    us1: frUs1,
    us2: frUs2,
    us3: frUs3,
    us4: frUs4
  }
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "us1", "us2", "us3", "us4"],
  interpolation: {
    escapeValue: false
  },
  compatibilityJSON: "v4"
});

export default i18n;
