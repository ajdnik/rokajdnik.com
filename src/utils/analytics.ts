import { installPostHogSnippet } from "./posthog-snippet.js";

const POSTHOG_KEY = "phc_dXOUwVcZZh7C9gSY6M7aeNjxSM0WXYJvlF1VXB9qgD8";

type PostHogClient = {
  init: (key: string, config: Record<string, unknown>) => void;
  opt_in_capturing: () => void;
  opt_out_capturing: () => void;
  reset: (resetDeviceId?: boolean) => void;
};

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

let enabled = false;
let initialized = false;
let scheduled = false;

function schedule(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback);
  } else {
    window.setTimeout(callback, 1);
  }
}

// PostHog storage: `ph_<key>_*` persistence (distinct/device/session IDs)
// and the `__ph_opt_in_out_<key>` capture flag.
const OPT_OUT_PREFIX = "__ph_opt_in_out_";
const isPostHogKey = (name: string) =>
  name.startsWith("ph_") || name.startsWith("__ph_");

function clearStorage(storage: Storage, keep?: (name: string) => boolean) {
  try {
    for (const name of Object.keys(storage)) {
      if (isPostHogKey(name) && !keep?.(name)) storage.removeItem(name);
    }
  } catch {
    // Storage unavailable.
  }
}

function clearCookies(keep?: (name: string) => boolean) {
  const labels = location.hostname.split(".");
  // PostHog may scope its cookie to the current host or a parent domain.
  const domains = [""];
  for (let i = 0; i < labels.length - 1; i++) {
    domains.push(`; domain=.${labels.slice(i).join(".")}`);
  }
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!isPostHogKey(name) || keep?.(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
}

export function enableAnalytics() {
  enabled = true;
  if (initialized) {
    // Re-granted after being withdrawn on this page.
    window.posthog?.opt_in_capturing();
    return;
  }
  if (scheduled) return;
  scheduled = true;
  // Drop any leftover opt-out flag so a fresh grant starts capturing.
  const isIdentifier = (name: string) => !name.startsWith(OPT_OUT_PREFIX);
  clearStorage(localStorage, isIdentifier);
  clearCookies(isIdentifier);
  schedule(() => {
    scheduled = false;
    // Consent may have been withdrawn before the idle callback ran.
    if (!enabled) return;
    installPostHogSnippet();
    window.posthog?.init(POSTHOG_KEY, {
      api_host: "https://tm.rokajdnik.com",
      ui_host: "https://eu.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "always",
      opt_out_persistence_by_default: true,
    });
    initialized = true;
  });
}

export function disableAnalytics() {
  enabled = false;
  if (initialized && window.posthog) {
    // reset() also clears PostHog's own consent state, so it must run
    // before opting out.
    window.posthog.reset(true);
    window.posthog.opt_out_capturing();
  }
  // Remove PostHog identifiers, but keep the opt-out flag so a still-loaded
  // client on this page cannot resume capturing. It is cleared on re-grant.
  const keep = (name: string) => name.startsWith(OPT_OUT_PREFIX);
  clearStorage(localStorage, keep);
  clearStorage(sessionStorage, keep);
  clearCookies(keep);
}
