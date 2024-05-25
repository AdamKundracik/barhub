import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en/translation.json";
import sk from "./translations/sk/translation.json";

const resources = {
  en: {
    translation: en,
  },
  sk: {
    translation: sk,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "sk",
  fallbackLng: "en",
  compatibilityJSON: "v3",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
