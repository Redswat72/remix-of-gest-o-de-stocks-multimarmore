import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export interface PWAContextValue {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  needRefresh: boolean;
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  isIOS: boolean;
  isAndroid: boolean;
}

const VERSION_STORAGE_KEY = 'stockflow-app-version';

export const PWAContext = createContext<PWAContextValue | null>(null);

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isPreviewHost = () =>
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

const canRegisterServiceWorker = () =>
  !import.meta.env.DEV && !isInIframe() && !isPreviewHost() && 'serviceWorker' in navigator;

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [serviceWorkerNeedRefresh, setServiceWorkerNeedRefresh] = useState(false);
  const [versionNeedRefresh, setVersionNeedRefresh] = useState(false);
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const serviceWorkerCheckIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    checkInstalled();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (!canRegisterServiceWorker()) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    updateServiceWorkerRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateApp().catch(() => setServiceWorkerNeedRefresh(true));
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        registration.update().catch(() => {});
        serviceWorkerCheckIntervalRef.current = window.setInterval(() => {
          if (navigator.onLine) {
            registration.update().catch(() => {});
          }
        }, 5 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              updateApp().catch(() => setServiceWorkerNeedRefresh(true));
            }
          });
        });
      },
    });

    return () => {
      if (serviceWorkerCheckIntervalRef.current) {
        window.clearInterval(serviceWorkerCheckIntervalRef.current);
      }
    };
  }, []);

  const checkPublishedVersion = useCallback(async () => {
    if (import.meta.env.DEV || isPreviewHost()) return;

    try {
      const response = await fetch(`/app-version.json?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) return;

      const data = (await response.json()) as { version?: string };
      if (!data.version) return;

      const currentVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      if (!currentVersion) {
        localStorage.setItem(VERSION_STORAGE_KEY, data.version);
        return;
      }

      if (currentVersion !== data.version) {
        setVersionNeedRefresh(true);
      }
    } catch (error) {
      console.error('Erro ao verificar versão publicada:', error);
    }
  }, []);

  useEffect(() => {
    checkPublishedVersion();

    const interval = window.setInterval(checkPublishedVersion, 60 * 1000);
    window.addEventListener('focus', checkPublishedVersion);
    document.addEventListener('visibilitychange', checkPublishedVersion);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', checkPublishedVersion);
      document.removeEventListener('visibilitychange', checkPublishedVersion);
    };
  }, [checkPublishedVersion]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        await updateServiceWorkerRef.current?.(false);
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      localStorage.removeItem(VERSION_STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao atualizar app:', e);
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set('_v', Date.now().toString());
      window.location.replace(url.toString());
    }
  }, []);

  const value: PWAContextValue = {
    isOnline,
    isInstallable,
    isInstalled,
    needRefresh: serviceWorkerNeedRefresh || versionNeedRefresh,
    installApp,
    updateApp,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}