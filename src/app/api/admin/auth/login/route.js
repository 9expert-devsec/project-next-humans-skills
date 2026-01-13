// src/app/api/admin/auth/login/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_NAME = process.env.ADMIN_TOKEN_NAME || "admin_token";
const SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev-secret";

function normalizeEmail(x) {
  return String(x || "").trim().toLowerCase();
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const password = String(body.password || "").trim();
  const adminKey = String(body.adminKey || "").trim();

  // ✅ เช็ค adminKey ถ้าตั้ง env ไว้
  const expectedAdminKey = String(process.env.ADMIN_KEY || "").trim();
  if (expectedAdminKey && adminKey !== expectedAdminKey) {
    return NextResponse.json(
      { ok: false, message: "Invalid admin key" },
      { status: 401 }
    );
  }

  const allowed = String(process.env.ADMIN_EMAIL || "admin@local")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const expectedPass = String(process.env.ADMIN_PASSWORD || "1234");

  // 🔎 debug แบบปลอดภัย (ดูใน terminal)
  console.log("[ADMIN_LOGIN]", {
    email,
    hasPassword: !!password,
    adminKeyLen: adminKey.length,
    hasEnvAdminKey: !!expectedAdminKey,
    allowedCount: allowed.length,
    hasEnvPass: !!process.env.ADMIN_PASSWORD,
    tokenName: TOKEN_NAME,
  });

  const ok = allowed.includes(email) && password === expectedPass;

  if (!ok) {
    return NextResponse.json(
      { ok: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { role: "admin", email, adminKey: expectedAdminKey || adminKey },
    SECRET,
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({ ok: true });

  // localhost = secure false, prod = true
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
