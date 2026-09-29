// First-party record of the visitor's privacy choices. It is only used to
// remember that choice and is never read by analytics.

export type ConsentState = "unset" | "granted" | "denied";
export type ConsentDecision = Exclude<ConsentState, "unset">;

export const CONSENT_STORAGE_KEY = "privacy-consent";
export const CONSENT_CHANGE_EVENT = "privacy-consent-change";
const CONSENT_VERSION = 1;

interface StoredConsent {
  version: number;
  analytics: ConsentDecision;
  updatedAt: string;
}

// Fallback for when storage is unavailable (e.g. blocked by the browser).
let memoryConsent: ConsentState = "unset";

function parse(raw: string | null): ConsentState {
  if (!raw) return "unset";
  try {
    const value = JSON.parse(raw) as Partial<StoredConsent>;
    if (
      value.version === CONSENT_VERSION &&
      (value.analytics === "granted" || value.analytics === "denied")
    ) {
      return value.analytics;
    }
  } catch {
    // Malformed records are treated as no decision.
  }
  return "unset";
}

export function getAnalyticsConsent(): ConsentState {
  try {
    const stored = parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    // Storage may be readable but not writable (e.g. quota exceeded).
    return stored === "unset" ? memoryConsent : stored;
  } catch {
    return memoryConsent;
  }
}

export function setAnalyticsConsent(analytics: ConsentDecision): void {
  memoryConsent = analytics;
  const record: StoredConsent = {
    version: CONSENT_VERSION,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Keep the in-memory choice for this page view.
  }
  window.dispatchEvent(
    new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: analytics }),
  );
}

export function onAnalyticsConsentChange(
  callback: (state: ConsentState) => void,
): void {
  window.addEventListener(CONSENT_CHANGE_EVENT, (event) =>
    callback((event as CustomEvent<ConsentState>).detail),
  );
  // Keep other open tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      callback(parse(event.newValue));
    }
  });
}

// Removes PostHog identifiers and persistence (cookies, localStorage and
// sessionStorage entries prefixed with "ph_" or "__ph_"). While a PostHog
// instance is still running on the page, its opt-out flag must be kept so it
// stays opted out; otherwise it would fall back to capturing.
export function clearAnalyticsStorage({ keepOptOut = false } = {}): void {
  const isAnalyticsKey = (key: string) =>
    (key.startsWith("ph_") || key.startsWith("__ph_")) &&
    !(keepOptOut && key.startsWith("__ph_opt_in_out_"));

  for (const storage of [localStorage, sessionStorage]) {
    try {
      Object.keys(storage)
        .filter(isAnalyticsKey)
        .forEach((key) => storage.removeItem(key));
    } catch {
      // Storage unavailable; nothing to clear.
    }
  }

  const hostParts = location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < hostParts.length - 1; i++) {
    domains.push(`; domain=.${hostParts.slice(i).join(".")}`);
  }
  document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter(isAnalyticsKey)
    .forEach((name) => {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    });
}
