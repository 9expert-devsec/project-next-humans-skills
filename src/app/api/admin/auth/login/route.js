// src/app/api/admin/auth/login/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_NAME = process.env.ADMIN_TOKEN_NAME || "admin_token";
const SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev-secret";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const password = String(body.password || "").trim();

  // TODO: เปลี่ยนตรงนี้เป็นเช็คจริงของคุณ
  const allowed = String(process.env.ADMIN_EMAIL || "admin@local")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const ok =
    allowed.includes(email.toLowerCase()) &&
    password === (process.env.ADMIN_PASSWORD || "1234");

  if (!ok) {
    return NextResponse.json(
      { ok: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign({ role: "admin", email }, SECRET, { expiresIn: "7d" });

  const res = NextResponse.json({ ok: true });

  // ✅ จุดสำคัญ: set cookie ให้ถูกต้องบน localhost
  res.cookies.set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: false, // localhost ต้อง false
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
