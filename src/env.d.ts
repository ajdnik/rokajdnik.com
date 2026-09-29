/// <reference path="../.astro/types.d.ts" />

interface Window {
  // PostHog client, only present after analytics consent is granted.
  posthog: any;
}
