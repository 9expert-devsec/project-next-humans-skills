"use client";

export default function ScrollToUpcomingButton() {
  return (
    <a
      href="#upcoming-classes"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("upcoming-classes")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }}
      className="
        group inline-flex items-center justify-center gap-2
        rounded-2xl
        border border-[#F6D76B]/40
        bg-gradient-to-b from-[#FFE27A] via-[#F2CB55] to-[#DDAE2A]
        px-4 py-2
        lg:px-7 lg:py-4
        text-xs lg:text-lg font-extrabold text-[#0B1C2C]
        ring-1 ring-white/10
        transition-all duration-200
        hover:-translate-y-0.5
        hover:brightness-105
        hover:shadow-[0_5px_30px_rgba(231,195,74,0.3),inset_0_1px_0_rgba(255,255,255,0.55)]
        active:translate-y-0
        md:px-6 md:py-3.5 md:text-base
      "
    >
      <span className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0)_45%)] opacity-80" />
      <span className="relative">เปิดรับสมัครแล้ว</span>
    </a>
  );
}
