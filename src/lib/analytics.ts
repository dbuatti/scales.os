type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
    umami?: { track: (event: string, props?: AnalyticsProps) => void };
  }
}

const env = import.meta.env as Record<string, string | undefined>;
const isDev = Boolean(import.meta.env.DEV);

/**
 * Provider-agnostic analytics. Works with Plausible (manual mode) or Umami.
 * If neither is configured it stays silent in production and logs in dev.
 * Analytics must never be able to break the app.
 */
export const track = (event: string, props?: AnalyticsProps) => {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.plausible === 'function') {
      window.plausible(event, props ? { props } : undefined);
      return;
    }
    if (window.umami?.track) {
      window.umami.track(event, props);
      return;
    }
  } catch {
    // ignore analytics failures
  }

  if (isDev) {
    console.debug('[analytics]', event, props ?? {});
  }
};

export const trackPageview = () => {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.plausible === 'function') {
      window.plausible('pageview');
      return;
    }
    window.umami?.track('pageview');
  } catch {
    // ignore analytics failures
  }
};

/** Injects the configured analytics script. Call once, before render. */
export const installAnalytics = () => {
  if (typeof document === 'undefined') return;

  const plausibleDomain = env.VITE_PLAUSIBLE_DOMAIN;
  if (plausibleDomain && !document.querySelector('script[data-plausible]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-plausible', '');
    script.setAttribute('data-domain', plausibleDomain);
    script.src = env.VITE_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.manual.js';
    document.head.appendChild(script);
  }

  const umamiSrc = env.VITE_UMAMI_SRC;
  const umamiWebsite = env.VITE_UMAMI_WEBSITE_ID;
  if (umamiSrc && umamiWebsite && !document.querySelector('script[data-umami]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-umami', '');
    script.setAttribute('data-website-id', umamiWebsite);
    script.src = umamiSrc;
    document.head.appendChild(script);
  }
};