import { Navigate } from 'react-router-dom';

/**
 * Maps store domains to their respective company slugs.
 * When accessed via a store domain, redirects to /loja/:slug.
 */
const STORE_DOMAINS: Record<string, string> = {
  'multimarmore.store': 'multimarmore',
  'www.multimarmore.store': 'multimarmore',
  'magratex.store': 'magratex',
  'www.magratex.store': 'magratex',
};

export function getStoreDomainSlug(): string | null {
  const hostname = window.location.hostname;
  return STORE_DOMAINS[hostname] ?? null;
}

export function StoreDomainRedirect({ children }: { children: React.ReactNode }) {
  const slug = getStoreDomainSlug();
  
  if (slug) {
    // If we're on a store domain but NOT already on /loja/*, redirect
    if (!window.location.pathname.startsWith('/loja/')) {
      return <Navigate to={`/loja/${slug}`} replace />;
    }
  }
  
  return <>{children}</>;
}
