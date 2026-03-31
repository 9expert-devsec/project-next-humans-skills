"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Layers3,
  LogOut,
  NotebookPen,
  Radio,
} from "lucide-react";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      {
        label: "Courses",
        href: "/courses",
        icon: BookOpen,
      },
      {
        label: "Registrations",
        href: "/registrations",
        icon: NotebookPen,
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        label: "Public Registers",
        href: "/public-registers",
        icon: Radio,
      },
      {
        label: "Course Alerts",
        href: "/course-alerts",
        icon: BellRing,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Media",
        href: "/media",
        icon: ImageIcon,
      },
      {
        label: "Articles",
        href: "/articles",
        icon: FileText,
      },
    ],
  },
];

export default function AdminSidebar({
  title = "Admin",
  subtitle = "NEXT SKILLS Admin",
  locale = "th",
  adminKey = "",
}) {
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

  function isActive(fullHref) {
    return pathname === fullHref || pathname?.startsWith(`${fullHref}/`);
  }

  function itemClass(fullHref) {
    const active = isActive(fullHref);

    return cx(
      "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all",
      active
        ? "bg-white text-slate-950 shadow-[0_12px_40px_rgba(255,255,255,0.12)]"
        : "text-white/70 hover:bg-white/6 hover:text-white",
    );
  }

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-white/10 bg-[#08111f] xl:flex xl:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href={`${base}/courses`} className="block">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Layers3 className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="text-base font-extrabold tracking-tight text-white">
                {title}
              </div>
              <div className="mt-1 text-xs text-white/45">{subtitle}</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                {group.label}
              </div>

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const fullHref = `${base}${item.href}`;

                  return (
                    <Link
                      key={item.label}
                      href={fullHref}
                      className={itemClass(fullHref)}
                    >
                      <span
                        className={cx(
                          "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                          isActive(fullHref)
                            ? "border-slate-200/70 bg-slate-100 text-slate-950"
                            : "border-white/10 bg-white/[0.04] text-white/70 group-hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <Link
          href={`/${locale}`}
          className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white"
        >
          <span>Open website</span>
          <span className="text-white/35">↗</span>
        </Link>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
