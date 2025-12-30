"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
// import LocaleSwitch from "@/components/LocaleSwitch";

export default function Header({ locale = "th" }) {
  const pathname = usePathname();
  const isEN = locale === "en";

  const t = {
    home: isEN ? "Home" : "หน้าแรก",
    admin: isEN ? "Admin" : "แอดมิน",
    course: isEN ? "Course" : "หลักสูตร",
  };

  // ✅ show menu "หลักสูตร" เฉพาะหน้า home ของ locale นั้น ๆ
  // ตัวอย่าง: /th หรือ /en เท่านั้น (ไม่รวม /th/xxx)
  const isHome = useMemo(() => {
    const p = String(pathname || "/");
    return p === `/${locale}` || p === `/${locale}/`;
  }, [pathname, locale]);

  const [showBrand, setShowBrand] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ทำ glass ให้เข้มขึ้นนิดตอนมีการเลื่อน
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // โชว์ชื่อเมื่อ "banner" หลุดออกจาก viewport (ทำงานเฉพาะหน้า home ก็พอ)
  useEffect(() => {
    if (!isHome) {
      setShowBrand(true); // หน้าอื่นให้โชว์ brand ตลอด จะดูนิ่งกว่า
      return;
    }

    const bannerEl = document.querySelector("#banner");

    // fallback ถ้าไม่เจอ banner
    if (!bannerEl) {
      const onScroll = () => setShowBrand(window.scrollY > 200);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setShowBrand(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-72px 0px 0px 0px",
      }
    );

    io.observe(bannerEl);
    return () => io.disconnect();
  }, [isHome]);

  // ✅ กด "หลักสูตร" ให้เลื่อนทุกครั้ง แม้กดซ้ำ hash เดิมก็เลื่อนได้
  function goCourses() {
    // อยู่หน้าอื่น: ไม่ควรมีปุ่มนี้แล้ว แต่กันไว้เผื่อ
    if (!isHome) return;

    const el = document.querySelector("#courses");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // อัปเดต hash แบบไม่เพิ่ม history และทำให้กดซ้ำได้
      // (replaceState ช่วยให้ URL มี #courses โดยไม่ทำให้ browser ignore click ครั้งถัดไป)
      try {
        const url = `/${locale}#courses`;
        window.history.replaceState(null, "", url);
      } catch {}
    }
  }

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50",
        "backdrop-blur-xl",
        "border-b border-white/10",
        scrolled ? "bg-white/10 shadow-lg" : "bg-white/5",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <div
          className={[
            "transition-all duration-300",
            showBrand
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none",
          ].join(" ")}
          aria-hidden={!showBrand}
        >
          {/* ให้ลิงก์ไปหน้า home ของ locale เสมอ */}
          <Link
            href={`/${locale}`}
            className="text-white text-xl font-semibold tracking-wide"
          >
            The Next Humans Skills
          </Link>
        </div>

        {/* Right menu */}
        <div className="flex items-center gap-3 text-white">
          {/* ✅ โชว์ "หลักสูตร" เฉพาะหน้า home */}
          {isHome && (
            <button
              type="button"
              onClick={goCourses}
              className="px-2 py-1 text-lg hover:opacity-80"
            >
              {t.course}
            </button>
          )}

          {/* เปิดใช้ทีหลังได้ */}
          {/*
          <div className="langPill" aria-label="Language switch">
            <LocaleSwitch />
          </div>
          */}
        </div>
      </nav>
    </header>
  );
}