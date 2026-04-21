import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enAuth from "./locales/en/auth.json";
import enHome from "./locales/en/home.json";
import enNeeds from "./locales/en/needs.json";
import enResources from "./locales/en/resources.json";
import enContribution from "./locales/en/contribution.json";
import enClaims from "./locales/en/claims.json";

import frCommon from "./locales/fr/common.json";
import frLayout from "./locales/fr/layout.json";
import frAuth from "./locales/fr/auth.json";
import frHome from "./locales/fr/home.json";
import frNeeds from "./locales/fr/needs.json";
import frResources from "./locales/fr/resources.json";
import frContribution from "./locales/fr/contribution.json";
import frClaims from "./locales/fr/claims.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        layout: enLayout,
        auth: enAuth,
        home: enHome,
        needs: enNeeds,
        resources: enResources,
        contribution: enContribution,
        claims: enClaims
      },
      fr: {
        common: frCommon,
        layout: frLayout,
        auth: frAuth,
        home: frHome,
        needs: frNeeds,
        resources: frResources,
        contribution: frContribution,
        claims: frClaims
      }
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "mutuity-language"
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
