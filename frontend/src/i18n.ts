import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enAuth from "./locales/en/auth.json";
import enHome from "./locales/en/home.json";
import enNeeds from "./locales/en/needs.json";
import enResources from "./locales/en/resources.json";
import enContribution from "./locales/en/contribution.json";
import enClaims from "./locales/en/claims.json";
import enBids from "./locales/en/bids.json";
import enCampaigns from "./locales/en/campaigns.json";
import enProfile from "./locales/en/profile.json";
import enNotifications from "./locales/en/notifications.json";
import enPreferences from "./locales/en/preferences.json";
import enGrants from "./locales/en/grants.json";
import enChat from "./locales/en/chat.json";
import enLegal from "./locales/en/legal.json";

import frCommon from "./locales/fr/common.json";
import frLayout from "./locales/fr/layout.json";
import frAuth from "./locales/fr/auth.json";
import frHome from "./locales/fr/home.json";
import frNeeds from "./locales/fr/needs.json";
import frResources from "./locales/fr/resources.json";
import frContribution from "./locales/fr/contribution.json";
import frClaims from "./locales/fr/claims.json";
import frBids from "./locales/fr/bids.json";
import frCampaigns from "./locales/fr/campaigns.json";
import frProfile from "./locales/fr/profile.json";
import frNotifications from "./locales/fr/notifications.json";
import frPreferences from "./locales/fr/preferences.json";
import frGrants from "./locales/fr/grants.json";
import frChat from "./locales/fr/chat.json";
import frLegal from "./locales/fr/legal.json";

void i18n
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
        claims: enClaims,
        bids: enBids,
        campaigns: enCampaigns,
        profile: enProfile,
        notifications: enNotifications,
        preferences: enPreferences,
        grants: enGrants,
        chat: enChat,
        legal: enLegal
      },
      fr: {
        common: frCommon,
        layout: frLayout,
        auth: frAuth,
        home: frHome,
        needs: frNeeds,
        resources: frResources,
        contribution: frContribution,
        claims: frClaims,
        bids: frBids,
        campaigns: frCampaigns,
        profile: frProfile,
        notifications: frNotifications,
        preferences: frPreferences,
        grants: frGrants,
        chat: frChat,
        legal: frLegal
      }
    },
    lng: "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
