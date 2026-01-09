"use client";

import Image from "next/image";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

async function jsonFetch(url) {
  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  const data = await res?.json().catch(() => ({}));
  if (!res || !res.ok || data?.ok === false)
    throw new Error(data?.error || "Request failed");
  return data;
}

function clampText(s, n = 180) {
  const t = String(s || "").trim();
  if (!t) return "";
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

function fmtDate(d, locale) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    const loc = locale === "en" ? "en-GB" : "th-TH";
    return new Intl.DateTimeFormat(loc, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  } catch {
    return "";
  }
}

export default function NewsMediaPanelClient({
  locale = "th",
  limit = 20,
  sideCount = 4,
  autoMs = 5000,
}) {
  const isEN = locale === "en";

  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  const [autoPlay, setAutoPlay] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const data = await jsonFetch(
          `/api/public/media?locale=${encodeURIComponent(
            locale
          )}&limit=${encodeURIComponent(limit)}`
        );
        const arr = Array.isArray(data?.items) ? data.items : [];
        if (!alive) return;
        setItems(arr);
        setActive(0);
      } catch {
        if (!alive) return;
        setItems([]);
        setActive(0);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [locale, limit]);

  const featured = items[active] || null;

  const sideItems = useMemo(
    () => items.slice(0, sideCount),
    [items, sideCount]
  );

  // autoplay
  useEffect(() => {
    if (!autoPlay) return;
    if (!items.length) return;

    const t = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, autoMs);

    return () => clearInterval(t);
  }, [autoPlay, items.length, autoMs]);

  function prev() {
    if (!items.length) return;
    setActive((i) => (i - 1 + items.length) % items.length);
  }
  function next() {
    if (!items.length) return;
    setActive((i) => (i + 1) % items.length);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
        {isEN ? "Loading..." : "กำลังโหลด..."}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
        {isEN ? "No media yet." : "ยังไม่มีข่าวสาร/สื่อ"}
      </div>
    );
  }

  const featuredDate = fmtDate(
    featured?.publishedAt || featured?.createdAt,
    locale
  );
  const featuredRead = Math.max(1, Number(featured?.readMins || 3));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.65fr_.85fr]">
        {/* Featured */}
        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div
            className="relative aspect-[16/9] bg-black/30"
            onMouseEnter={() => setAutoPlay(false)}
            onMouseLeave={() => setAutoPlay(true)}
          >
            <Image
              src={featured?.imageUrl}
              alt={featured?.title || "featured"}
              fill
              className="object-cover"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            <div className="absolute left-4 top-4">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                {isEN ? "Featured Post" : "ข่าวเด่น"}
              </span>
            </div>

            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoPlay((v) => !v)}
                className="rounded-full border border-white/15 bg-black/30 p-2 text-white hover:bg-black/45"
                title={autoPlay ? "Pause" : "Play"}
              >
                {autoPlay ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                onClick={prev}
                className="rounded-full border border-white/15 bg-black/30 p-2 text-white hover:bg-black/45"
                title="Prev"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-full border border-white/15 bg-black/30 p-2 text-white hover:bg-black/45"
                title="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              {/* ✅ date + read mins */}
              <div className="text-white/70 text-xs sm:text-sm flex items-center gap-2">
                <span>{featuredDate}</span>
                <span className="opacity-60">•</span>
                <span>
                  {featuredRead} {isEN ? "min read" : "นาทีอ่าน"}
                </span>
              </div>

              <div className="mt-2 text-white text-xl sm:text-2xl font-extrabold leading-snug">
                {featured?.title || (isEN ? "Untitled" : "ไม่มีชื่อ")}
              </div>

              {featured?.caption ? (
                <div className="mt-2 text-white/80 text-sm sm:text-base max-w-3xl">
                  {clampText(featured.caption, 220)}
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-xl bg-white/15 hover:bg-white/20 text-white px-4 py-2 text-sm font-semibold"
                >
                  {isEN ? "View" : "ดูภาพใหญ่"}
                </button>

                {featured?.linkUrl ? (
                  <a
                    href={featured.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 hover:bg-black/35 text-white px-4 py-2 text-sm font-semibold"
                  >
                    {isEN ? "Read more" : "อ่านต่อ"}
                    <ExternalLink size={16} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Side list */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-white font-bold text-lg">
            {isEN ? "Latest" : "รายการข่าว"}
          </div>
          <div className="mt-1 text-white/60 text-sm">
            {isEN ? "Click to switch featured." : "คลิกเพื่อเปลี่ยนข่าวเด่น"}
          </div>

          <div className="mt-4 space-y-3">
            {sideItems.map((it, idx) => {
              const isActive = idx === active;
              const d = fmtDate(it.publishedAt || it.createdAt, locale);
              const rm = Math.max(1, Number(it.readMins || 3));

              return (
                <button
                  key={it._id}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={cx(
                    "w-full text-left rounded-2xl border p-3 flex gap-3 items-center transition",
                    isActive
                      ? "border-white/25 bg-white/10"
                      : "border-white/10 bg-black/15 hover:bg-black/25"
                  )}
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image
                      src={it.imageUrl}
                      alt={it.title || "thumb"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* ✅ date + read mins */}
                    <div className="text-white/60 text-[11px] flex items-center gap-2">
                      <span>{d}</span>
                      <span className="opacity-60">•</span>
                      <span>
                        {rm} {isEN ? "min read" : "นาทีอ่าน"}
                      </span>
                    </div>

                    <div className="mt-1 text-white font-semibold leading-snug line-clamp-2">
                      {it.title || (isEN ? "Untitled" : "ไม่มีชื่อ")}
                    </div>

                    {it.caption ? (
                      <div className="mt-1 text-white/60 text-xs line-clamp-2">
                        {it.caption}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {open ? (
        <div
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="mx-auto mt-10 w-[min(980px,92vw)] rounded-3xl border border-white/10 bg-[#0B1C2C] overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] bg-black/30">
              <Image
                src={featured?.imageUrl}
                alt={featured?.title || "image"}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-5 sm:p-6">
              <div className="text-white/70 text-xs sm:text-sm flex items-center gap-2">
                <span>{featuredDate}</span>
                <span className="opacity-60">•</span>
                <span>
                  {featuredRead} {isEN ? "min read" : "นาทีอ่าน"}
                </span>
              </div>

              <div className="mt-2 text-white text-xl font-extrabold">
                {featured?.title || (isEN ? "Untitled" : "ไม่มีชื่อ")}
              </div>

              {featured?.caption ? (
                <div className="mt-2 text-white/80">{featured.caption}</div>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3">
                {featured?.linkUrl ? (
                  <a
                    href={featured.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/20 text-white px-4 py-2 text-sm font-semibold"
                  >
                    {isEN ? "Open link" : "เปิดลิงก์"}
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/15 bg-black/25 hover:bg-black/35 text-white px-4 py-2 text-sm font-semibold"
                >
                  {isEN ? "Close" : "ปิด"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
