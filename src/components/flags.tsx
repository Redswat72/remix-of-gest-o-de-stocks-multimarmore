/**
 * Bandeirinhas SVG reutilizáveis (PT/GB). Usadas pelos seletores de idioma
 * da loja pública e da app interna.
 */

export function FlagPT({ className = 'w-6 h-4 rounded-sm shadow-sm' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} style={{ display: 'block' }} aria-hidden="true">
      <rect width="30" height="20" fill="#FF0000" />
      <rect width="12" height="20" fill="#006600" />
      <circle cx="12" cy="10" r="4.5" fill="#FFCC00" />
      <circle cx="12" cy="10" r="3.2" fill="#FF0000" />
    </svg>
  );
}

export function FlagGB({ className = 'w-6 h-4 rounded-sm shadow-sm' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} style={{ display: 'block' }} aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}
