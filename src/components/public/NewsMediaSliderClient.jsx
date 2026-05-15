"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function NewsMediaSliderClient({ locale = "th" }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/public/media?locale=${encodeURIComponent(locale)}&type=news`,
        { cache: "no-store" }
      ).catch(() => null);

      const data = await res?.json().catch(() => ({}));
      setItems(Array.isArray(data?.items) ? data.items : []);
      setActive(0);
    })();
  }, [locale]);

  const has = items.length > 0;
  const current = items[active] || items[0];

  // auto slide
  useEffect(() => {
    if (!has || hover) return;

    timerRef.current = setInterval(() => {
      setActive((x) => (x + 1) % items.length);
    }, 4500);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [has, hover, items.length]);

  function prev() {
    if (!has) return;
    setActive((x) => (x - 1 + items.length) % items.length);
  }

  function next() {
    if (!has) return;
    setActive((x) => (x + 1) % items.length);
  }

  if (!has) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        {locale === "en"
          ? "No media yet"
          : "ยังไม่มีสื่อ/รูปภาพ (ไปเพิ่มในหลังบ้านได้เลย)"}
      </div>
    );
  }

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full text-left"
          aria-label="Open media"
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={current.imageUrl}
              alt={current.title || "Media"}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority={active === 0}
            />
          </div>

          <div className="p-4">
            <div className="text-white font-semibold text-lg line-clamp-1">
              {current.title || (locale === "en" ? "Untitled" : "ไม่มีชื่อ")}
            </div>
            <div className="text-white/70 text-sm line-clamp-2 mt-1">
              {current.caption ||
                (locale === "en"
                  ? "Click to view larger"
                  : "กดเพื่อดูภาพใหญ่")}
            </div>
          </div>
        </button>

        {/* controls */}
        <div className="absolute inset-x-0 top-3 flex items-center justify-between px-3">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="rounded-xl bg-black/40 px-3 py-2 text-white hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="rounded-xl bg-black/40 px-3 py-2 text-white hover:bg-black/60"
          >
            ›
          </button>
        </div>

        {/* dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              className={cx(
                "h-2.5 w-2.5 rounded-full",
                idx === active ? "bg-white" : "bg-white/40"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B1C2C]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={current.imageUrl}
                alt={current.title || "Media"}
                fill
                className="object-contain bg-black/40"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white text-xl font-semibold">
                    {current.title ||
                      (locale === "en" ? "Untitled" : "ไม่มีชื่อ")}
                  </div>

                  {current.caption && (
                    <div className="text-white/75 mt-2">
                      {current.caption}
                    </div>
                  )}

                  {current.linkUrl && (
                    <a
                      href={current.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-white underline underline-offset-4"
                    >
                      {locale === "en" ? "Open link" : "เปิดลิงก์"}
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-xl bg-white/10 px-3 py-2 text-white hover:bg-white/15"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
