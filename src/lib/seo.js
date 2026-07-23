// src/lib/seo.js
// Shared SEO / Open Graph configuration.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.thenexthumansskills.com";

// Cache-bust token for the OG image. Bump when the OG artwork changes.
export const OG_VERSION = "20260723-2";

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og/home-og-v2.jpg?v=${OG_VERSION}`,
  width: 1200,
  height: 630,
  type: "image/jpeg",
};
