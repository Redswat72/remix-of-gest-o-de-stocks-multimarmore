import { useContext } from 'react';
import { PWAContext, PWAProvider } from '@/context/PWAContext';

export { PWAProvider };

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider');
  }
  return context;
}