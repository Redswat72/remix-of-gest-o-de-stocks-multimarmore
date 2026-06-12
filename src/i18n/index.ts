import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Loja (10 idiomas) — namespace 'translation' (default)
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

// App interna — namespace 'app' (PT/EN)
import appPt from './app/pt.json';
import appEn from './app/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt, app: appPt },
      en: { translation: en, app: appEn },
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
    defaultNS: 'translation',
    ns: ['translation', 'app'],
    interpolation: { escapeValue: false },
    detection: {
      // Inicialização: a loja usa 'store-language'. A app interna lê 'app-language'
      // explicitamente no AppLayout. Não usamos caches automáticos para evitar
      // que mudar de idioma num contexto polua o outro — a persistência é manual
      // via lib/appLanguage.ts (app) e components/loja/LanguageSelector (loja).
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'store-language',
      caches: [],
    },
  });

export default i18n;
