let _loading = null;

export function loadRecaptcha(siteKey) {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.grecaptcha?.execute) return Promise.resolve(true);

  if (_loading) return _loading;

  _loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey
    )}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

  return _loading;
}

export async function getRecaptchaToken(siteKey, action = "nx_register") {
  const ok = await loadRecaptcha(siteKey);
  if (!ok) throw new Error("recaptcha load failed");
  await new Promise((r) => window.grecaptcha.ready(r));
  const token = await window.grecaptcha.execute(siteKey, { action });
  if (!token) throw new Error("recaptcha token empty");
  return token;
}
