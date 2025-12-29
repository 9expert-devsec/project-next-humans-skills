"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LocaleSwitch from "@/components/LocaleSwitch";

export default function Header({ locale = "th" }) {
  const isEN = locale === "en";
  const t = {
    home: isEN ? "Home" : "หน้าแรก",
    admin: isEN ? "Admin" : "แอดมิน",
    course: isEN ? "Course" : "หลักสูตร",
  };

  const [showBrand, setShowBrand] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ทำ glass ให้เข้มขึ้นนิดตอนมีการเลื่อน
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // โชว์ชื่อเมื่อ "banner" หลุดออกจาก viewport
  useEffect(() => {
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
        setShowBrand(!entry.isIntersecting); // ไม่เห็น banner => showBrand = true
      },
      {
        threshold: 0,
        // เผื่อความสูง navbar ~72px ให้ถือว่าพ้น banner เมื่อเลื่อนเลยขอบบนจริง ๆ
        rootMargin: "-72px 0px 0px 0px",
      }
    );

    io.observe(bannerEl);
    return () => io.disconnect();
  }, []);

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
        {/* Brand (ซ่อนตอนแรก) */}
        <div
          className={[
            "transition-all duration-300",
            showBrand
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none",
          ].join(" ")}
          aria-hidden={!showBrand}
        >
          <Link href="/" className="text-white text-xl font-semibold tracking-wide">
            The Next Humans Skills
          </Link>
        </div>

        {/* Right menu */}
        <div className="flex items-center gap-3 text-white">
          {/* <Link className="navLink" href={`/${locale}`}>
            {t.home}
          </Link> */}
          <Link href="#courses" className="px-2 py-1 text-lg hover:opacity-80">
            {t.course}
          </Link>
          {/* <Link href="#faqs" className="px-2 py-1 text-sm hover:opacity-80">
            FAQs
          </Link>

          <Link
            className="navLink"
            href={`/${locale}/k8Pz7M2xYn5R0wLq/admin/login`}
          >
            {t.admin}
          </Link>

          <div className="langPill" aria-label="Language switch">
            <LocaleSwitch />
          </div> */}

          {/* Language switch mock */}
          {/* <div className="flex overflow-hidden rounded-lg border border-white/15 bg-white/10">
            <button className="px-3 py-1 text-sm hover:bg-white/10">TH</button>
            <button className="px-3 py-1 text-sm hover:bg-white/10">EN</button>
          </div> */}
        </div>
      </nav>
    </header>

    // <div className="topbar">
    //   <div className="container">
    //     <div className="nav">
    //       <Link href={`/${locale}`} className="brand">
    //         <span className="brandDot" />
    //         <span>NEXT SKILLS</span>
    //       </Link>

    //       <div className="navLinks">
    //         <Link className="navLink" href={`/${locale}`}>
    //           {t.home}
    //         </Link>
    //         <Link className="navLink" href={`/${locale}/k8Pz7M2xYn5R0wLq/admin/login`}>
    //           {t.admin}
    //         </Link>
    //       </div>

    //       <div className="langPill" aria-label="Language switch">
    //         <LocaleSwitch />
    //       </div>
    //     </div>
    //   </div>
    //   <hr className="hr" />
    // </div>
  );
}
