import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en/translation.json';
import sk from './translations/sk/translation.json';
import de from './translations/de/translation.json';
import es from './translations/es/translation.json';

const resources = {
  en: {
    translation: en,
  },
  sk: {
    translation: sk,
  },
  de: {
    translation: de,
  },
  es: {
    translation: es,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'sk',
  fallbackLng: 'en',
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
