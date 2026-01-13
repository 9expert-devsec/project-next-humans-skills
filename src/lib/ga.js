export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function pageview(url) {
  if (!GA_ID) return;
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("config", GA_ID, { page_path: url });
}

export function gaEvent({ action, category, label, value }) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}
