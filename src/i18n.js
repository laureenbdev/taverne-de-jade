import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

const resources = {
  en: { translation: translationEN },
  fr: { translation: translationFR },
};

function readInitialLanguage() {
  try {
    const stored = window.localStorage.getItem('taverne-lang');
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // localStorage can be unavailable; English stays the default.
  }
  return 'en';
}

const initialLanguage = readInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false,
    },
  });

document.documentElement.lang = initialLanguage;

export default i18n;
