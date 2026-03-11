"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarDays,
  Clock3,
  ArrowRight,
} from "lucide-react";

function pickTitle(c, isEN) {
  return (
    (isEN ? c?.title_en : c?.title_th) ||
    c?.title_th ||
    c?.title_en ||
    c?.title ||
    "Untitled"
  );
}

function pickCover(c) {
  return c?.cover_image || c?.cover || c?.coverUrl || c?.cover_url || "";
}

function pickSlug(c) {
  return c?.slug || c?.courseSlug || "";
}

// ✅ ใช้ข้อความวันอบรมจากหลังบ้านก่อน
function pickRoundDateLabel(c, isEN) {
  const text =
    c?.upcoming_date_text ||
    c?.upcomingDateText ||
    c?.upcomingDateLabel ||
    c?.upcoming_date_label ||
    "";

  if (String(text || "").trim()) return String(text).trim();

  const raw =
    c?.roundDate || c?.startDate || c?.startAt || c?.nextStartAt || "";

  if (!raw) {
    return isEN ? "Schedule soon" : "กำหนดรอบเร็วๆนี้";
  }

  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) {
    return isEN ? "Schedule soon" : "กำหนดรอบเร็วๆนี้";
  }

  return dt.toLocaleDateString(isEN ? "en-GB" : "th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getUpcomingBadge(tag, isEN) {
  const t = String(tag || "").trim();

  if (t === "nearly_full") {
    return {
      label: isEN ? "Nearly full" : "ใกล้เต็ม",
      Icon: AlertTriangle,
      className: "bg-amber-500/80 text-amber-100 ring-amber-500/30",
    };
  }

  if (t === "full") {
    return {
      label: isEN ? "Full" : "เต็ม",
      Icon: XCircle,
      className: "bg-rose-500/80 text-rose-100 ring-rose-500/30",
    };
  }

  return {
    label: isEN ? "Open" : "เปิดรับสมัคร",
    Icon: CheckCircle2,
    className: "bg-emerald-500/80 text-emerald-100 ring-emerald-500/30",
  };
}

export default function UpcomingClassesClient({ locale = "th", limit = 4 }) {
  const isEN = locale === "en";
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setErr("");
      try {
        const res = await fetch(
          `/api/public/courses?upcoming=1&limit=${encodeURIComponent(limit)}`,
          { cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Load failed (${res.status})`);
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Load failed");
        setItems([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [limit]);

  const emptyText = useMemo(
    () => (isEN ? "No upcoming classes yet" : "ยังไม่มีคลาสที่กำลังจะมาถึง"),
    [isEN],
  );

  if (items === null) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: Math.min(limit, 4) }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="h-44 bg-white/5 animate-pulse sm:h-auto sm:w-60" />
              <div className="flex-1 p-5">
                <div className="h-4 w-3/5 rounded-xl bg-white/5 animate-pulse" />
                <div className="mt-3 h-3 w-4/5 rounded-xl bg-white/5 animate-pulse" />
                <div className="mt-4 flex gap-2">
                  <div className="h-7 w-28 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        {err ? err : emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((c) => {
        const title = pickTitle(c, isEN);
        const cover = pickCover(c);
        const slug = pickSlug(c);
        const href = slug ? `/${locale}/courses/${slug}` : `/${locale}`;

        const badge = getUpcomingBadge(c?.upcomingTag, isEN);
        const roundDateLabel = pickRoundDateLabel(c, isEN);
        const days = Math.max(1, Number(c?.duration_days || 1));

        return (
          <Link
            key={c?._id || slug || title}
            href={href}
            className="
              group relative overflow-hidden rounded-[28px]
              border border-white/15 bg-white/10 backdrop-blur-xl
              shadow-[0_14px_40px_rgba(0,0,0,0.35)]
              transition-transform duration-300 hover:-translate-y-1
            "
          >
            <div className="pointer-events-none absolute -top-24 left-10 h-48 w-48 rounded-full bg-white blur-3xl opacity-100" />

            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-60">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={title}
                    className="
                      absolute inset-0 h-full w-full object-cover
                      object-[10%_10%]
                      transition duration-300 group-hover:scale-[1.03]
                    "
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs font-bold text-white/45">
                    No cover
                  </div>
                )}

                {/* overlays */}
                {/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_30%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.65)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_10%,rgba(56,189,248,0.35)_0%,rgba(56,189,248,0)_60%)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-black/0 sm:bg-gradient-to-t" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%221%22 stitchTiles=%22stitch%22/></filter><rect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.6%22/></svg>')]" /> */}

                {/* badge */}
                <div
                  className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.className}`}
                >
                  <badge.Icon className="h-4 w-4" />
                  {badge.label}
                </div>
              </div>

              {/* Content */}
              <div className="relative flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-white sm:text-xl">
                    {title}
                  </div>

                  <div className="hidden items-center gap-2 text-sm font-semibold text-white/85 sm:inline-flex">
                    {isEN ? "View" : "ดู"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {c?.short_description ? (
                  <div className="mt-2 line-clamp-2 text-sm text-white/65">
                    {String(c.short_description)}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/10">
                    <Clock3 className="h-4 w-4 text-white/75" />
                    {isEN ? `${days} day(s)` : `${days} วัน`}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/10">
                    <CalendarDays className="h-4 w-4 text-white/75" />
                    {roundDateLabel}
                  </span>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/85 sm:hidden">
                  {isEN ? "View details" : "ดูรายละเอียด"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
