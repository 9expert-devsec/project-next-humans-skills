import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const secret = String(process.env.ADMIN_PATH_KEY || "").trim();

  // 1) ปิดเส้นเดิม: /th/admin/... และ /en/admin/...
  // ให้เป็น 404 ไปเลย (ไม่ redirect เพื่อไม่บอกใบ้)
  if (/^\/(th|en)\/admin(\/|$)/.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2) อนุญาตเฉพาะ /{locale}/{secret}/admin/...
  const m = pathname.match(/^\/(th|en)\/([^/]+)\/admin(\/|$)/);
  if (m) {
    const keyInUrl = m[2] || "";
    if (!secret || keyInUrl !== secret) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  return NextResponse.next();
}

// ให้ middleware ทำงานกับทุก path ใต้ /th และ /en
export const config = {
  matcher: ["/(th|en)/:path*"],
};
