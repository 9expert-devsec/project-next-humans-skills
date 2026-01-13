// src/app/api/admin/auth/logout/route.js
import { NextResponse } from "next/server";

const TOKEN_NAME = process.env.ADMIN_TOKEN_NAME || "admin_token";
const IS_DEV = process.env.NODE_ENV !== "production";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: !IS_DEV, // ✅ dev=false, prod=true
    path: "/",
    maxAge: 0,
  });
  return res;
}
