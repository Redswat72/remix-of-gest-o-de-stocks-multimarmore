import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LANGS = [
  { code: 'pt', flag: '🇵🇹' },
  { code: 'en', flag: '🇬🇧' },
] as const;

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'pt';

  return (
    <div className="flex items-center gap-1">
      {LANGS.map(({ code, flag }) => (
        <Button
          key={code}
          variant="ghost"
          size="sm"
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 h-8 text-base rounded-lg transition-all ${
            current === code
              ? 'bg-[rgba(30,87,153,0.2)] ring-1 ring-[rgba(30,87,153,0.4)]'
              : 'opacity-50 hover:opacity-80 hover:bg-[rgba(255,255,255,0.06)]'
          }`}
          title={code.toUpperCase()}
        >
          {flag}
        </Button>
      ))}
    </div>
  );
}
