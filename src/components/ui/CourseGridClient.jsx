// src/components/ui/CourseGridClient.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function pickTitle(c, isEN) {
  // รองรับทั้งรูปแบบ normalize ที่คุณส่งจาก API + เผื่อรูปแบบเก่าที่เคยใช้
  return (
    (isEN ? c?.title_en : c?.title_th) ||
    c?.title_th ||
    c?.title_en ||
    c?.title ||
    c?.courseName ||
    "Untitled"
  );
}

function pickShort(c, isEN) {
  return (
    c?.short_description ||
    c?.short ||
    (isEN ? c?.short_en : c?.short_th) ||
    c?.short_th ||
    c?.short_en ||
    c?.detailTh ||
    c?.detailEn ||
    ""
  );
}

function pickCover(c) {
  return c?.cover_image || c?.cover || c?.coverUrl || c?.cover_url || "";
}

function pickSlug(c) {
  return c?.slug || c?.courseSlug || "";
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
          { cache: "no-store" }
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
    [isEN]
  );

  if (items === null) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <div className="aspect-[16/9] w-full bg-white/5 animate-pulse" />
            <div className="p-4">
              <div className="h-4 w-4/5 rounded-xl bg-white/5 animate-pulse" />
              <div className="mt-3 h-3 w-3/5 rounded-xl bg-white/5 animate-pulse" />
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
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
        const desc = pickShort(c, isEN);
        const cover = pickCover(c);
        const slug = pickSlug(c);

        const href = slug ? `/${locale}/courses/${slug}` : `/${locale}`;

        return (
          <Link
            key={c?._id || slug || title}
            href={href}
            className="
        group relative block w-full overflow-hidden rounded-3xl
        bg-white/10 backdrop-blur-xl
        border border-white/15
        shadow-[0_14px_40px_rgba(0,0,0,0.35)]
        transition-transform duration-200 hover:-translate-y-1
      "
            // className={cx(
            //   "group overflow-hidden rounded-3xl border border-white/10 bg-white/5",
            //   "transition hover:bg-white/7 hover:border-white/15"
            // )}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                boxShadow: `
            inset 0 0 0 3px rgba(59, 130, 246, 0.95),
            0 0 0 3px rgba(59, 130, 246, 0.6),
            0 0 60px rgba(59, 130, 246, 0.55),
          `,
              }}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0" />
            </div>

            <div className="relative p-5">
              <div className="text-white text-lg font-semibold leading-snug">
                {title}
              </div>

              {/* <div className="mt-1 text-sm text-white/60 line-clamp-2">
                {desc
                  ? String(desc).slice(0, 110)
                  : isEN
                  ? "View details"
                  : "ดูรายละเอียด"}
              </div> */}

              <div className="mt-4 flex flex-col gap-2">
                {c?.level ? (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm  text-white/70 ring-1 ring-white/10 w-fit border border-white/10 font-semibold">
                    {c.level}
                  </span>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs  text-white/80 ring-1 ring-white/10">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: "var(--acc-blue)" }}
                    />
                    {isEN ? "Register" : "ลงทะเบียน"}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs  text-white/80 ring-1 ring-white/10 ">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: c?.isActive
                          ? "var(--acc-green)"
                          : "rgba(255,255,255,.35)",
                      }}
                    />
                    {c?.isActive
                      ? isEN
                        ? "Active"
                        : "เปิดรับ"
                      : isEN
                      ? "Draft"
                      : "ร่าง"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
