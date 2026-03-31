"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

const SEGMENT_LABELS = {
  courses: "Courses",
  registrations: "Registrations",
  "public-registers": "Public Registers",
  "course-alerts": "Course Alerts",
  media: "Media",
  articles: "Articles",
  new: "New",
  edit: "Edit",
};

function titleCase(x = "") {
  return String(x || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function AdminTopbar({ locale = "th", adminKey = "" }) {
  const pathname = usePathname();

  if (pathname?.includes("/admin/login")) return null;

  const base = `/${locale}/${adminKey}/admin`;

  async function logout() {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    window.location.href = `${base}/login`;
  }

  const crumbs = useMemo(() => {
    const parts = String(pathname || "")
      .split("/")
      .filter(Boolean);
    const adminIndex = parts.findIndex((p) => p === "admin");

    if (adminIndex === -1) {
      return [{ label: "Admin", href: base }];
    }

    const afterAdmin = parts.slice(adminIndex + 1);

    const acc = [];
    const result = [{ label: "Admin", href: base }];

    afterAdmin.forEach((seg) => {
      acc.push(seg);
      result.push({
        label: SEGMENT_LABELS[seg] || titleCase(seg),
        href: `${base}/${acc.join("/")}`,
      });
    });

    return result;
  }, [pathname, base]);

  const currentTitle = crumbs[crumbs.length - 1]?.label || "Admin";

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(7,19,33,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1 text-xs font-semibold text-white/40">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;

              return (
                <div key={`${crumb.href}-${idx}`} className="flex items-center">
                  {idx > 0 ? (
                    <ChevronRight className="mx-1 h-3.5 w-3.5 text-white/20" />
                  ) : null}

                  {isLast ? (
                    <span className="text-white/75">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition hover:text-white/75"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="truncate text-lg font-bold tracking-tight text-white">
            {currentTitle}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}`}
            className={cx(
              "hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white",
              "sm:inline-flex",
            )}
          >
            View site
          </Link>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
