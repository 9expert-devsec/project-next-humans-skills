import { NextResponse } from "next/server";

const TOKEN_NAME = process.env.ADMIN_TOKEN_NAME || "admin_token";
const PUBLIC = ["/th/admin/login", "/en/admin/login"];

export function proxy(req) {
  const { pathname } = req.nextUrl;

  // กันเฉพาะ /{locale}/admin...
  if (!/^\/(th|en)\/admin(\/|$)/.test(pathname)) return NextResponse.next();
  if (PUBLIC.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/en")
      ? "/en/admin/login"
      : "/th/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(th|en)/admin/:path*"],
};
