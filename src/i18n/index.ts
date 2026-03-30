import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './pt.json';
import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import es from './es.json';
import vi from './vi.json';
import zh from './zh.json';
import ja from './ja.json';
import ar from './ar.json';
import th from './th.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      es: { translation: es },
      vi: { translation: vi },
      zh: { translation: zh },
      ja: { translation: ja },
      ar: { translation: ar },
      th: { translation: th },
    },
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'store-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
