// middleware.js (ROOT)
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const ADMIN_PATH_KEY = String(process.env.ADMIN_PATH_KEY || "").trim();
  const TOKEN_NAME = String(
    process.env.ADMIN_TOKEN_NAME || "admin_token"
  ).trim();

  // ปิดเส้นเดิม explains: /th/admin/... , /en/admin/...
  if (/^\/(th|en)\/admin(\/|$)/.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // match เฉพาะ /{locale}/{adminKey}/admin/...
  const m = pathname.match(/^\/(th|en)\/([^/]+)\/admin(\/|$)/);
  if (!m) return NextResponse.next();

  const locale = m[1];
  const keyInUrl = m[2] || "";

  if (!ADMIN_PATH_KEY || keyInUrl !== ADMIN_PATH_KEY) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // ✅ allow login (กันทุกกรณี /login และ /login/ และ subpath)
  const loginPrefix = `/${locale}/${keyInUrl}/admin/login`;
  if (pathname === loginPrefix || pathname.startsWith(loginPrefix + "/")) {
    return NextResponse.next();
  }

  // auth guard
  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = loginPrefix;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/(th|en)/:path*"] };
