import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LANGS = [
  'pt', 'en', 'fr', 'de', 'es', 'vi', 'zh', 'ja', 'ar', 'th',
] as const;

function FlagPT() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="20" fill="#FF0000" />
      <rect width="12" height="20" fill="#006600" />
      <circle cx="12" cy="10" r="4.5" fill="#FFCC00" />
      <circle cx="12" cy="10" r="3.2" fill="#FF0000" />
    </svg>
  );
}

function FlagGB() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

function FlagFR() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  );
}

function FlagDE() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="6.67" fill="#000000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCC00" />
    </svg>
  );
}

function FlagES() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="5" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
      <rect y="15" width="30" height="5" fill="#AA151B" />
    </svg>
  );
}

function FlagVN() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="20" fill="#DA251D" />
      <polygon points="15,3 16.8,9 23,9 18,12.5 19.8,18.5 15,15 10.2,18.5 12,12.5 7,9 13.2,9" fill="#FFFF00" />
    </svg>
  );
}

function FlagCN() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="20" fill="#DE2910" />
      <polygon points="5,3 5.9,5.8 9,5.8 6.5,7.5 7.4,10.3 5,8.5 2.6,10.3 3.5,7.5 1,5.8 4.1,5.8" fill="#FFDE00" />
      <polygon points="11,1.5 11.4,2.7 12.7,2.7 11.6,3.5 12,4.7 11,3.9 10,4.7 10.4,3.5 9.3,2.7 10.6,2.7" fill="#FFDE00" />
      <polygon points="13.5,3.5 13.9,4.7 15.2,4.7 14.1,5.5 14.5,6.7 13.5,5.9 12.5,6.7 12.9,5.5 11.8,4.7 13.1,4.7" fill="#FFDE00" />
      <polygon points="13.5,7 13.9,8.2 15.2,8.2 14.1,9 14.5,10.2 13.5,9.4 12.5,10.2 12.9,9 11.8,8.2 13.1,8.2" fill="#FFDE00" />
      <polygon points="11,10 11.4,11.2 12.7,11.2 11.6,12 12,13.2 11,12.4 10,13.2 10.4,12 9.3,11.2 10.6,11.2" fill="#FFDE00" />
    </svg>
  );
}

function FlagJP() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  );
}

function FlagAR() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="6.67" fill="#006C35" />
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#000000" />
      <rect width="7.5" height="20" fill="#CE1126" />
    </svg>
  );
}

function FlagTH() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 rounded-sm shadow-sm" style={{ display: 'block' }}>
      <rect width="30" height="3.33" fill="#A51931" />
      <rect y="3.33" width="30" height="3.33" fill="#F4F5F8" />
      <rect y="6.67" width="30" height="6.67" fill="#2D2A4A" />
      <rect y="13.33" width="30" height="3.33" fill="#F4F5F8" />
      <rect y="16.67" width="30" height="3.33" fill="#A51931" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<string, () => JSX.Element> = {
  pt: FlagPT,
  en: FlagGB,
  fr: FlagFR,
  de: FlagDE,
  es: FlagES,
  vi: FlagVN,
  zh: FlagCN,
  ja: FlagJP,
  ar: FlagAR,
  th: FlagTH,
};

const LANG_LABELS: Record<string, string> = {
  pt: 'PT',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
  vi: 'VI',
  zh: '中文',
  ja: 'JA',
  ar: 'AR',
  th: 'TH',
};

function resolveLang(lang: string): string {
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('vi')) return 'vi';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('th')) return 'th';
  if (lang.startsWith('pt')) return 'pt';
  return 'pt';
}

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = resolveLang(i18n.language ?? 'pt');

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {LANGS.map((code) => {
        const Flag = FLAG_COMPONENTS[code];
        const isActive = current === code;
        return (
          <Button
            key={code}
            variant="ghost"
            size="sm"
            onClick={() => i18n.changeLanguage(code)}
            className={`px-1.5 py-1 h-7 rounded-lg transition-all flex items-center gap-1 ${
              isActive
                ? 'bg-[rgba(30,87,153,0.2)] ring-1 ring-[rgba(30,87,153,0.4)]'
                : 'opacity-50 hover:opacity-90 hover:bg-[rgba(255,255,255,0.06)]'
            }`}
            title={code.toUpperCase()}
          >
            <Flag />
            <span className="text-[10px] font-medium text-[#F5F2ED] uppercase leading-none">{LANG_LABELS[code]}</span>
          </Button>
        );
      })}
    </div>
  );
}
