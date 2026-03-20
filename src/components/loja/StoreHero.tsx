import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoreConfig } from '@/types/store';
import heroMarble from '@/assets/hero-marble.jpg';

export function StoreHero({ config }: { config: StoreConfig }) {
  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroMarble} alt="Premium marble" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1D21] via-[#1A1D21]/95 to-[#1E2127]/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(30,87,153,0.1)] border border-[rgba(30,87,153,0.2)] mb-8">
          <Sparkles className="h-4 w-4 text-[#1E5799]" />
          <span className="text-sm font-medium text-[#1E5799] tracking-wide uppercase">
            {config.tagline}
          </span>
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#F7F5F2] mb-6 tracking-tight"
          style={{ lineHeight: 1.1, fontFamily: "'Cormorant Garamond', serif" }}
        >
          {config.heroTitle}
        </h1>

        <p className="text-lg md:text-xl text-[#A8ADB5] mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          {config.heroSubtitle}
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={scrollToCatalog}
            className="px-10 py-7 text-lg rounded-xl gap-3 group font-semibold"
            style={{ background: 'linear-gradient(135deg, #F7941D, #FFA940)', color: '#1A1D21' }}
          >
            Ver Catálogo
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-16 pt-10 border-t border-[rgba(30,87,153,0.15)]">
          {config.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-semibold text-[#F7941D] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {stat.value}
              </p>
              <p className="text-sm text-[rgba(168,173,181,0.6)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1A1D21] to-transparent" />
    </section>
  );
}
