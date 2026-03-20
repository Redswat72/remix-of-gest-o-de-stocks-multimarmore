import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LANGS = [
  { code: 'pt', label: 'PT', colors: { left: '#006600', right: '#FF0000', circle: '#FFCC00' } },
  { code: 'en', label: 'EN', colors: { bg: '#012169', cross: '#FFFFFF', diagCross: '#C8102E' } },
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

const FLAG_COMPONENTS: Record<string, () => JSX.Element> = {
  pt: FlagPT,
  en: FlagGB,
};

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'pt';

  return (
    <div className="flex items-center gap-1.5">
      {Object.entries(FLAG_COMPONENTS).map(([code, Flag]) => (
        <Button
          key={code}
          variant="ghost"
          size="sm"
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 h-8 rounded-lg transition-all flex items-center gap-1.5 ${
            current === code
              ? 'bg-[rgba(30,87,153,0.2)] ring-1 ring-[rgba(30,87,153,0.4)]'
              : 'opacity-50 hover:opacity-90 hover:bg-[rgba(255,255,255,0.06)]'
          }`}
          title={code.toUpperCase()}
        >
          <Flag />
          <span className="text-xs font-medium text-[#F5F2ED] uppercase">{code}</span>
        </Button>
      ))}
    </div>
  );
}
