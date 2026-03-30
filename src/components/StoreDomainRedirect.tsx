import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const navigate = useNavigate();
  const slug = getStoreDomainSlug();

  useEffect(() => {
    if (slug && !location.pathname.startsWith(`/loja/`)) {
      navigate(`/loja/${slug}`, { replace: true });
    }
  }, [slug, location.pathname, navigate]);

  return <>{children}</>;
}
