"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminTopbar({
  title = "Admin",
  subtitle,
  locale = "th",
  adminKey = "",
}) {
  const pathname = usePathname();

  // ซ่อน topbar บนหน้า login (กันรก + กันสับสน)
  if (pathname?.includes("/admin/login")) return null;

  const base = `/${locale}/${adminKey}/admin`;

  async function logout() {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    location.href = `/${locale}/${adminKey}/admin/login`;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,28,45,.70)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* LEFT */}
        <div>
          <Link href={base}>
            <div className="text-sm font-extrabold text-white md:text-base hover:underline">
              {title}
            </div>
          </Link>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-white/60">{subtitle}</div>
          ) : null}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Link
            href={`${base}/courses`}
            className="rounded-lg px-3 py-2 text-xs font-extrabold text-white/80 hover:bg-white/10"
          >
            Courses
          </Link>

          <Link
            href={`${base}/registrations`}
            className="rounded-lg px-3 py-2 text-xs font-extrabold text-white/80 hover:bg-white/10"
          >
            Registrations
          </Link>

          <Link
            href={`${base}/media`}
            className="rounded-lg px-3 py-2 text-xs font-extrabold text-white/80 hover:bg-white/10"
          >
            Media
          </Link>

          <Link
            href={`${base}/articles`}
            className="rounded-lg px-3 py-2 text-xs font-extrabold text-white/80 hover:bg-white/10"
          >
            Articles
          </Link>

          <button
            onClick={logout}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold text-white hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
