import { useAppTranslation } from '@/hooks/useAppT';
import { setAppLanguage, type AppLanguage } from '@/lib/appLanguage';
import { Button } from '@/components/ui/button';
import { FlagPT, FlagGB } from '@/components/flags';
import { cn } from '@/lib/utils';

interface AppLanguageSelectorProps {
  className?: string;
}

const LANGS: { code: AppLanguage; label: string; Flag: () => JSX.Element }[] = [
  { code: 'pt', label: 'PT', Flag: () => <FlagPT className="w-5 h-3.5 rounded-sm" /> },
  { code: 'en', label: 'EN', Flag: () => <FlagGB className="w-5 h-3.5 rounded-sm" /> },
];

export function AppLanguageSelector({ className }: AppLanguageSelectorProps) {
  const { i18n, t } = useAppTranslation();
  const current: AppLanguage = i18n.language?.startsWith('en') ? 'en' : 'pt';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {LANGS.map(({ code, label, Flag }) => {
        const isActive = current === code;
        return (
          <Button
            key={code}
            variant="ghost"
            size="sm"
            onClick={() => setAppLanguage(code)}
            title={t('language.switchTo', { lang: t(`language.${code}`) })}
            className={cn(
              'h-8 px-2 gap-1.5 rounded-md text-xs font-semibold',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Flag />
            <span>{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
