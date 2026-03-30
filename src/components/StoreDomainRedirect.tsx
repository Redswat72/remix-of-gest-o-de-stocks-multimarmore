import { useLocation, useNavigate, Navigate } from 'react-router-dom';

/**
 * Maps store domains to their respective company slugs.
 * When accessed via a store domain, forces /loja/:slug routes only.
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
  const location = useLocation();
  const slug = getStoreDomainSlug();

  // If we're on a store domain and NOT already on the correct /loja/ path,
  // redirect immediately during render (not in useEffect) to prevent flicker
  if (slug && !location.pathname.startsWith(`/loja/${slug}`)) {
    return <Navigate to={`/loja/${slug}`} replace />;
  }

  return <>{children}</>;
}
