"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function TrainingGallerySection({ locale = "th" }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalActive, setModalActive] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/public/media?locale=${encodeURIComponent(locale)}&type=gallery&limit=20`,
        { cache: "no-store" }
      ).catch(() => null);

      const data = await res?.json().catch(() => ({}));
      setItems(Array.isArray(data?.items) ? data.items : []);
      setActive(0);
    })();
  }, [locale]);

  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(4);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const has = items.length > 0;
  const maxActive = Math.max(0, items.length - visibleCount);
  const pageCount = Math.max(1, items.length - visibleCount + 1);

  useEffect(() => {
    if (active > maxActive) setActive(maxActive);
  }, [maxActive, active]);

  useEffect(() => {
    if (!has || hover) return;
    const t = setInterval(() => {
      setActive((x) => {
        const max = Math.max(0, items.length - visibleCount);
        return x >= max ? 0 : x + 1;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [has, hover, items.length, visibleCount]);

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  function prev() {
    setActive((x) => (x <= 0 ? maxActive : x - 1));
  }

  function next() {
    setActive((x) => (x >= maxActive ? 0 : x + 1));
  }

  function modalPrev() {
    setModalActive((x) => (x - 1 + items.length) % items.length);
  }

  function modalNext() {
    setModalActive((x) => (x + 1) % items.length);
  }

  if (!has) return null;

  const heading = locale === "en" ? "Training Atmosphere" : "ภาพบรรยากาศการอบรม";
  const modalCurrent = items[modalActive] || items[0];

  return (
    <section className="bg-[#0B1C2C] py-16 px-4">
      <h2 className="text-center text-white text-4xl font-semibold">
        {heading}
      </h2>

      <div
        role="region"
        aria-label="Training photo gallery"
        className="relative mx-auto mt-10 max-w-6xl px-6"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${active * (100 / visibleCount)}%)`,
            }}
          >
            {items.map((item, idx) => (
              <div
                key={item._id || idx}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  onClick={() => {
                    setModalActive(idx);
                    setModalOpen(true);
                  }}
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Training photo"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                      priority={idx < 4}
                    />
                  </div>

                  {item.title && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <p className="text-white text-sm font-semibold line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Previous"
          className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Next"
          className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: pageCount }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActive(idx)}
            aria-label={`Go to position ${idx + 1}`}
            className={cx(
              "h-2 rounded-full transition-all duration-300",
              active === idx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Training photo viewer"
        >
          <div
            className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B1C2C]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 rounded-xl bg-white/10 px-3 py-2 text-white hover:bg-white/20"
            >
              ✕
            </button>

            <div className="relative aspect-[16/9] w-full bg-black">
              <Image
                src={modalCurrent.imageUrl}
                alt={modalCurrent.title || "Training photo"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  modalPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  modalNext();
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {(modalCurrent.title || modalCurrent.caption) && (
              <div className="p-6">
                {modalCurrent.title && (
                  <div className="text-white text-xl font-bold">
                    {modalCurrent.title}
                  </div>
                )}
                {modalCurrent.caption && (
                  <div className="mt-2 text-white/70">
                    {modalCurrent.caption}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
