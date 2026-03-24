// src/components/ui/CourseGridClient.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function pickTitle(c, isEN) {
  return (
    (isEN ? c?.title_en : c?.title_th) ||
    c?.title_th ||
    c?.title_en ||
    c?.title ||
    c?.courseName ||
    "Untitled"
  );
}

function pickCover(c) {
  return c?.cover_image || c?.cover || c?.coverUrl || c?.cover_url || "";
}

function pickSlug(c) {
  return c?.slug || c?.courseSlug || "";
}

function isPublicUpcomingCourse(c) {
  return !!c?.isUpcoming;
}

function getUpcomingStatusUi(c, isEN) {
  const tag = String(c?.upcomingTag || "").trim();

  if (tag === "full") {
    return {
      text: isEN ? "Full" : "เต็ม",
      dot: "bg-rose-400",
    };
  }

  if (tag === "nearly_full") {
    return {
      text: isEN ? "Nearly full" : "ใกล้เต็ม",
      dot: "bg-amber-300",
    };
  }

  return {
    text: isEN ? "Open" : "เปิดรับ",
    dot: "bg-emerald-400",
  };
}

export default function CourseGridClient({ locale = "th", limit = 4 }) {
  const isEN = locale === "en";

  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setErr("");
      try {
        const res = await fetch(
          `/api/public/courses?limit=${encodeURIComponent(limit)}`,
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
    () => (isEN ? "No courses yet" : "ยังไม่มีคอร์ส"),
    [isEN],
  );

  if (items === null) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <div className="aspect-[16/9] w-full animate-pulse bg-white/5" />
            <div className="p-4">
              <div className="h-4 w-4/5 animate-pulse rounded-xl bg-white/5" />
              <div className="mt-3 h-3 w-3/5 animate-pulse rounded-xl bg-white/5" />
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/5" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-white/5" />
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((c) => {
        const title = pickTitle(c, isEN);
        const cover = pickCover(c);
        const slug = pickSlug(c);
        const href = slug ? `/${locale}/courses/${slug}` : `/${locale}`;

        const upcomingCourse = isPublicUpcomingCourse(c);
        const upcomingUi = getUpcomingStatusUi(c, isEN);

        return (
          <Link
            key={c?._id || slug || title}
            href={href}
            className="
              group relative block w-full overflow-hidden rounded-3xl
              border border-white/15 bg-white/10
              shadow-[0_14px_40px_rgba(0,0,0,0.35)]
              backdrop-blur-xl
              transition-transform duration-200 hover:-translate-y-1
            "
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              // style={{
              //   boxShadow: `
              //     inset 0 0 0 3px rgba(59, 130, 246, 0.95),
              //     0 0 0 3px rgba(59, 130, 246, 0.6),
              //     0 0 60px rgba(59, 130, 246, 0.55)
              //   `,
              // }}
            />

            <div className="relative aspect-[16/9] w-full bg-black/20">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs font-bold text-white/45">
                  No cover
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/10 to-black/0" />
            </div>

            <div className="relative p-5">
              <div className="text-lg font-semibold leading-snug text-white">
                {title}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {c?.level ? (
                  <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold text-white/70 ring-1 ring-white/10">
                    {c.level}
                  </span>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {upcomingCourse ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: "var(--acc-blue)" }}
                        />
                        {isEN ? "Register" : "ลงทะเบียน"}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                        <span
                          className={`h-2 w-2 rounded-full ${upcomingUi.dot}`}
                        />
                        {upcomingUi.text}
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-normal text-white/80 ">
                      <span className="h-2 w-2 rounded-full bg-amber-300" />
                      {isEN
                        ? "Request In-house Quotation"
                        : "ขอใบเสนอราคา Inhouse"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
