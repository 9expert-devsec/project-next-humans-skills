// src/lib/recaptchaServer.js

export async function verifyRecaptchaV3(token, expectedAction) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: false, reason: "missing RECAPTCHA_SECRET_KEY" };
  }

  const t = String(token || "").trim();
  if (!t) return { ok: false, reason: "missing token" };

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", t);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!data?.success) {
      return {
        ok: false,
        reason: `verify failed: ${
          (data?.["error-codes"] || []).join(",") || "unknown"
        }`,
      };
    }

    // v3 fields: action, score
    const action = String(data?.action || "");
    const score = Number(data?.score || 0);

    if (expectedAction && action && action !== expectedAction) {
      return { ok: false, reason: `action mismatch: ${action}` };
    }

    // ปรับ threshold ได้ (0.5–0.7 เป็นค่าที่นิยม)
    if (score < 0.5) {
      return { ok: false, reason: `low score: ${score}` };
    }

    return { ok: true, score, action };
  } catch (e) {
    return { ok: false, reason: e?.message || "recaptcha error" };
  }
}
