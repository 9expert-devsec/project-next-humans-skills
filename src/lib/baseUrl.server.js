import { headers } from "next/headers";

function trimSlash(s) {
  return String(s || "").replace(/\/+$/, "");
}

export async function getBaseUrl() {
  // ใช้ env ถ้ามี (เหมาะกับ production)
  const env =
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (env) return trimSlash(env);

  // fallback จาก request headers (dev + vercel)
  const h = await headers(); // ✅ Next 16: headers() is Promise
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function absUrl(path) {
  const base = await getBaseUrl();
  return new URL(path, base).toString();
}
