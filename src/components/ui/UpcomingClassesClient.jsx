"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarDays,
  ArrowRight,
  MapPin,
} from "lucide-react";

function clean(x) {
  return String(x || "").trim();
}

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

function pickLocation(c, isEN) {
  return (
    clean(c?.upcoming_location) ||
    clean(c?.upcomingLocation) ||
    clean(c?.location) ||
    clean(c?.venue) ||
    (isEN ? "" : "")
  );
}

function pickFullPrice(c) {
  const n = Number(
    c?.full_price ??
      c?.fullPrice ??
      c?.price_amount ??
      c?.business?.price_amount ??
      0,
  );
  return Number.isFinite(n) ? n : 0;
}

function pickEarlyBirdPrice(c) {
  const n = Number(
    c?.earlybird_price ??
      c?.earlybirdPrice ??
      c?.early_bird_price ??
      c?.business?.earlybird_price ??
      c?.business?.earlyBirdPrice ??
      0,
  );
  return Number.isFinite(n) ? n : 0;
}

function pickCurrency(c) {
  return (
    clean(c?.currency || c?.price_currency || c?.business?.price_currency) ||
    "THB"
  );
}

function fmtMoney(n, currency = "THB", isEN = false) {
  const value = Number(n || 0);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${value.toLocaleString(isEN ? "en-US" : "th-TH")} ${currency}`;
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
      className: "bg-amber-500/85 text-amber-100 ring-amber-500/30",
    };
  }

  if (t === "full") {
    return {
      label: isEN ? "Full" : "เต็ม",
      Icon: XCircle,
      className: "bg-rose-500/85 text-rose-100 ring-rose-500/30",
    };
  }

  return {
    label: isEN ? "Open" : "เปิดรับสมัคร",
    Icon: CheckCircle2,
    className: "bg-emerald-500/85 text-emerald-100 ring-emerald-500/30",
  };
}

function PriceCapsule({ label, value, tone = "slate" }) {
  if (!value) return null;

  const toneClass =
    tone === "amber"
      ? "text-[#ebc246] text-[14px]"
      : "text-slate-100 text-[11px]";

  const markPrice =
    tone === "amber" ? "text-[20px]" : "line-through text-white/50";

  return (
    <div
      className={`inline-flex items-end gap-2 rounded-full font-semibold ${toneClass}`}
    >
      <span className="opacity-80 leading-none">{label}</span>
      <span className={`font-extrabold leading-none ${markPrice}`}>{value}</span>
    </div>
  );
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
                <div className="mt-4 h-3 w-2/5 rounded-xl bg-white/5 animate-pulse" />
                <div className="mt-5 flex gap-2">
                  <div className="h-8 w-28 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-8 w-32 rounded-full bg-white/5 animate-pulse" />
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
        const locationText = pickLocation(c, isEN);

        const currency = pickCurrency(c);
        const fullPriceText = fmtMoney(pickFullPrice(c), currency, isEN);
        const earlyBirdText = fmtMoney(pickEarlyBirdPrice(c), currency, isEN);

        return (
          <Link
            key={c?._id || slug || title}
            href={href}
            scroll={true}
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

                <div
                  className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.className}`}
                >
                  <badge.Icon className="h-4 w-4" />
                  {badge.label}
                </div>
              </div>

              {/* Content */}
              <div className="relative flex flex-1 flex-col p-5">
                <div className="flex flex-col gap-2">
                  <div className="line-clamp-2 text-lg font-semibold leading-snug text-white sm:text-xl">
                    {title}
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-white">
                    <CalendarDays className="h-4 w-4 text-cyan-200/90" />
                    {roundDateLabel}
                  </div>

                  {locationText ? (
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-white">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-200/90" />
                      <span className="line-clamp-1">{locationText}</span>
                    </div>
                  ) : null}

                  {c?.short_description ? (
                    <div className="line-clamp-2 text-sm text-white/65">
                      {String(c.short_description)}
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-between items-end">
                  <div className="mt-4 flex flex-col gap-2 items-start">
                    <PriceCapsule
                      label={isEN ? "Full price" : "ราคาเต็ม"}
                      value={fullPriceText}
                      tone="slate"
                    />
                    <PriceCapsule
                      label={isEN ? "Early bird" : "Early Bird"}
                      value={earlyBirdText}
                      tone="amber"
                    />
                  </div>

                  {/* <div className="mt-5 flex items-end"> */}
                  {/* <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 ring-1 ring-white/10">
                    <CalendarDays className="h-4 w-4 text-white/75" />
                    {roundDateLabel}
                  </div> */}

                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                    <span>{isEN ? "View details" : "ดูรายละเอียด"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
