import { Shield, Award, Truck, Headphones, MapPin, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StoreConfig } from '@/types/store';
import logoMultimarmore from '@/assets/logo-multimarmore.png';
import logoMagratex from '@/assets/logo-magratex.png';

const logos: Record<string, string> = {
  multimarmore: logoMultimarmore,
  magratex: logoMagratex,
};

export function StoreFooter({ config }: { config: StoreConfig }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const features = [
    { icon: Shield, label: t('footer.certifiedQuality') },
    { icon: Award, label: t('footer.premiumExcellence') },
    { icon: Truck, label: t('footer.globalDelivery') },
    { icon: Headphones, label: t('footer.dedicatedSupport') },
  ];

  return (
    <footer className="py-16 px-6 border-t border-[rgba(30,87,153,0.15)]" style={{ backgroundColor: 'rgba(26, 29, 33, 0.95)' }}>
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-xl bg-[rgba(30,87,153,0.08)] flex items-center justify-center mb-3 group-hover:bg-[rgba(30,87,153,0.15)] transition-colors">
                <f.icon className="h-6 w-6 text-[#1E5799] opacity-60 group-hover:opacity-80 transition-opacity" />
              </div>
              <span className="text-sm font-medium text-[#A8ADB5]">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-[rgba(30,87,153,0.1)] mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <img src={logos[config.slug]} alt={config.displayName} className="h-12 w-auto object-contain mb-4" />
            <p className="text-xs text-[#1E5799] font-medium tracking-wider uppercase mb-3">{config.tagline}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#1E5799]">{t('footer.contacts')}</h4>
            <div className="space-y-3">
              <a href={`mailto:${config.email}`} className="flex items-center gap-2 text-sm text-[#A8ADB5] hover:text-[#F7941D] transition-colors">
                <Mail className="h-4 w-4" /> {config.email}
              </a>
              <a href={`tel:${config.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-[#A8ADB5] hover:text-[#F7941D] transition-colors">
                <Phone className="h-4 w-4" /> {config.phone}
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#1E5799]">{t('footer.address')}</h4>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#A8ADB5] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[rgba(168,173,181,0.7)] space-y-0.5">
                {config.address.map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[rgba(30,87,153,0.1)] mb-6" />
        <p className="text-center text-xs text-[rgba(168,173,181,0.5)]">
          © {year} {config.displayName} — {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
