// src/app/api/admin/me/route.js
import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin)
    return NextResponse.json({ ok: false, admin: null }, { status: 401 });
  return NextResponse.json({ ok: true, admin });
}
