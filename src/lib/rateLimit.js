// src/lib/rateLimit.js

const store = global.__NX_RATE_LIMIT__ || (global.__NX_RATE_LIMIT__ = new Map());

/**
 * rateLimitHit(key, {limit, windowMs})
 * - limit: จำนวนครั้งที่อนุญาตภายใน windowMs
 * - windowMs: ช่วงเวลา (ms)
 */
export function rateLimitHit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const k = String(key || "unknown");

  let entry = store.get(k);
  if (!entry) {
    entry = { resetAt: now + windowMs, count: 0 };
    store.set(k, entry);
  }

  // reset window
  if (now > entry.resetAt) {
    entry.resetAt = now + windowMs;
    entry.count = 0;
  }

  entry.count += 1;

  const remaining = Math.max(0, limit - entry.count);
  const ok = entry.count <= limit;

  // cleanup (กัน map โตเรื่อยๆ)
  // ลบ entry ที่หมดอายุและไม่ได้ใช้งานแล้วแบบหยาบๆ
  if (store.size > 5000) {
    for (const [kk, vv] of store.entries()) {
      if (now > vv.resetAt + windowMs) store.delete(kk);
    }
  }

  return {
    ok,
    limit,
    remaining,
    resetAt: entry.resetAt,
    retryAfterSec: ok ? 0 : Math.ceil((entry.resetAt - now) / 1000),
  };
}
