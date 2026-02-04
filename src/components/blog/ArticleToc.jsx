"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Link2, Check } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function normalizeItems(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .map((x) => ({
      id: String(x?.id || "").trim(),
      text: String(x?.text || "").trim(),
      level: Number(x?.level || 2),
    }))
    .filter((x) => x.id && x.text)
    .slice(0, 50);
}

function scrollToId(id, { updateHash = true } = {}) {
  const el = document.getElementById(id);
  if (!el) return false;

  const offset = 96; // กัน header/topbar
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });

  if (updateHash) {
    try {
      window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    } catch {}
  }
  return true;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function buildHashUrl(id) {
  try {
    const u = new URL(window.location.href);
    u.hash = id ? `#${id}` : "";
    return u.toString();
  } catch {
    return `${window.location.pathname}${id ? `#${id}` : ""}`;
  }
}

/** หา progress ของการอ่าน content */
function computeArticleProgress() {
  const art = document.querySelector(".article-content");
  if (!art) return 0;

  const rect = art.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  const height = Math.max(1, art.offsetHeight || rect.height || 1);

  // ให้เริ่มนับตอนเริ่มเข้าเนื้อหา และจบก่อนท้ายเล็กน้อย
  const start = top - 120;
  const end = top + height - 240;

  const y = window.scrollY;
  if (y <= start) return 0;
  if (y >= end) return 100;

  const p = ((y - start) / Math.max(1, end - start)) * 100;
  return Math.min(100, Math.max(0, p));
}

export default function ArticleToc({
  items = [],
  locale = "th",
  className = "",
  collapsible = false, // true = TOC ด้านบน (mobile)
}) {
  const list = useMemo(() => normalizeItems(items), [items]);

  const [activeId, setActiveId] = useState("");
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState("");

  const rafRef = useRef(null);
  const copiedTimerRef = useRef(null);

  const labelTitle = locale === "en" ? "Contents" : "สารบัญ";
  const labelEmpty =
    locale === "en" ? "No headings found." : "ยังไม่มีหัวข้อสำหรับสารบัญ";

  const minLevel = useMemo(() => {
    if (!list.length) return 2;
    return Math.min(...list.map((x) => x.level || 2));
  }, [list]);

  // ✅ Fallback: บทความเก่า (heading ใน HTML ยังไม่มี id) -> map ตามลำดับ TOC
  useEffect(() => {
    if (!list.length) return;

    const headings = Array.from(
      document.querySelectorAll(
        ".article-content h1, .article-content h2, .article-content h3, .article-content h4",
      ),
    );
    if (!headings.length) return;

    for (let i = 0; i < Math.min(list.length, headings.length); i++) {
      const wantId = list[i].id;
      if (!wantId) continue;

      if (document.getElementById(wantId)) continue;

      const h = headings[i];
      if (h && !h.id) h.id = wantId;
    }
  }, [list]);

  // ✅ Active section highlight (IntersectionObserver)
  useEffect(() => {
    if (!list.length) return;

    const ids = list.map((x) => x.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (best?.target?.id) setActiveId(best.target.id);
      },
      {
        root: null,
        rootMargin: "-15% 0px -70% 0px",
        threshold: [0.05, 0.2, 0.4, 0.6],
      },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [list]);

  // ✅ หากเข้ามาด้วย #hash ให้ scroll ไปยังหัวข้อ
  useEffect(() => {
    if (!list.length) return;

    const hash = decodeURIComponent(window.location.hash || "");
    if (!hash.startsWith("#")) return;
    const id = hash.slice(1);
    if (!id) return;

    const t = setTimeout(() => {
      const ok = scrollToId(id, { updateHash: false });
      if (ok) setActiveId(id);
    }, 80);

    return () => clearTimeout(t);
  }, [list]);

  // ✅ Progress bar update (scroll + resize) with rAF throttle
  useEffect(() => {
    const tick = () => {
      rafRef.current = null;
      setProgress(computeArticleProgress());
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onResize = () => {
      setProgress(computeArticleProgress());
    };

    setProgress(computeArticleProgress());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function onCopyLink(id) {
    const url = buildHashUrl(id);
    const ok = await copyToClipboard(url);

    if (ok) {
      setCopiedId(id);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(""), 1200);
    }
  }

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  if (!list.length) {
    return (
      <div
        className={cx(
          "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
          className,
        )}
      >
        <div className="text-sm font-semibold text-white">{labelTitle}</div>
        <div className="mt-2 text-sm text-white/60">{labelEmpty}</div>
      </div>
    );
  }

  const content = (
    <nav aria-label="Table of contents">
      {/* Rail + progress */}
      <div className="relative mt-3">
        {/* guide rail */}
        <div className="absolute left-[10px] top-2 bottom-2 w-px bg-white/10" />
        {/* progress fill */}
        <div
          className="absolute left-[10px] top-2 w-px bg-sky-400/70"
          style={{ height: `calc(${progress}% - 0px)` }}
        />

        <ul className="space-y-1">
          {list.map((it) => {
            const isActive = activeId === it.id;
            const indent = Math.max(0, (it.level - minLevel) * 12);

            return (
              <li key={it.id}>
                <div
                  className={cx(
                    "group relative flex items-stretch gap-2 rounded-xl",
                    isActive ? "bg-white/10" : "hover:bg-white/5",
                  )}
                >
                  {/* dot on rail */}
                  <span
                    className={cx(
                      "absolute left-[6px] top-[15px] h-2 w-2 rounded-full ring-2 ring-[#071827]",
                      isActive ? "bg-sky-300" : "bg-white/25",
                    )}
                  />

                  {/* main button */}
                  <button
                    type="button"
                    onClick={() => {
                      const ok = scrollToId(it.id, { updateHash: true });
                      if (ok) setActiveId(it.id);
                    }}
                    className={cx(
                      "flex-1 rounded-xl px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "text-white"
                        : "text-white/75 group-hover:text-white",
                    )}
                    style={{ paddingLeft: 18 + indent }}
                    title={it.text}
                  >
                    <span className="line-clamp-2">{it.text}</span>
                  </button>

                  {/* copy link */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCopyLink(it.id);
                    }}
                    className={cx(
                      "mr-2 mt-2 h-8 w-8 shrink-0 rounded-xl ring-1 ring-white/10 transition",
                      "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white",
                      "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
                    )}
                    title={
                      locale === "en" ? "Copy link" : "คัดลอกลิงก์หัวข้อนี้"
                    }
                    aria-label="Copy link"
                  >
                    {copiedId === it.id ? (
                      <Check className="mx-auto h-4 w-4 text-sky-300" />
                    ) : (
                      <Link2 className="mx-auto h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* tiny copied toast (desktop) */}
        {copiedId ? (
          <div className="pointer-events-none absolute -top-10 right-0 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur">
            {locale === "en" ? "Link copied" : "คัดลอกลิงก์แล้ว"}
          </div>
        ) : null}
      </div>
    </nav>
  );

  // top version (mobile) + mini progress bar
  if (collapsible) {
    return (
      <div
        className={cx(
          "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
          className,
        )}
      >
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">{labelTitle}</div>
            <ChevronDown className="h-4 w-4 text-white/70" />
          </summary>

          {/* mini progress */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-400/70"
              style={{ width: `${progress}%` }}
            />
          </div>

          {content}
        </details>
      </div>
    );
  }

  // right sidebar version (desktop) with side progress bar
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{labelTitle}</div>

        {/* compact progress % */}
        <div className="text-[11px] text-white/55">{Math.round(progress)}%</div>
      </div>

      {content}
    </div>
  );
}
