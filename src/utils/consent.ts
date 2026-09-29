// First-party record of the visitor's privacy choices. Stored only to
// remember that choice; never used for analytics or profiling.

export type ConsentState = "unset" | "granted" | "denied";

export interface ConsentRecord {
  version: number;
  analytics: Exclude<ConsentState, "unset">;
  updatedAt: string;
}

export const CONSENT_STORAGE_KEY = "privacy-consent";
export const CONSENT_CHANGE_EVENT = "privacy-consent-change";
const CONSENT_VERSION = 1;

function readRecord(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<ConsentRecord>;
    if (
      record.version === CONSENT_VERSION &&
      (record.analytics === "granted" || record.analytics === "denied")
    ) {
      return record as ConsentRecord;
    }
  } catch {
    // Storage unavailable or corrupted record: treat as unset.
  }
  return null;
}

export function getAnalyticsConsent(): ConsentState {
  return readRecord()?.analytics ?? "unset";
}

export function setAnalyticsConsent(analytics: ConsentRecord["analytics"]) {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable: the choice still applies to the current page.
  }
  window.dispatchEvent(
    new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: analytics }),
  );
}

export function onAnalyticsConsentChange(
  callback: (state: ConsentState) => void,
) {
  window.addEventListener(CONSENT_CHANGE_EVENT, (event) =>
    callback((event as CustomEvent<ConsentState>).detail),
  );
  // Keep other open tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      callback(getAnalyticsConsent());
    }
  });
}
