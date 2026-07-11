import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      "dashboard": "Tableau de Bord",
      "welcome": "Bienvenue",
    }
  },
  en: {
    translation: {
      "dashboard": "Dashboard",
      "welcome": "Welcome",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
