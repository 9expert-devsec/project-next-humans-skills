"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProfileFlipCard({
  logoSrc,
  logoB,
  personSrc,
  name,
  title,
  company,
  intro = "",
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="perspective-1000 w-[330px] h-[300px]">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="group relative h-full w-full text-left"
        aria-label="Flip profile card"
      >
        {/* ROTATOR: ตัวที่หมุนจริง */}
        <div
          className={[
            "relative h-full w-full preserve-3d will-change-transform [transform:translateZ(0)]",
            "transition-transform duration-500 ease-out",
            "group-hover:[transform:rotateY(180deg)]",
            flipped ? "[transform:rotateY(180deg)]" : "",
          ].join(" ")}
        >
          {/* ================= FRONT ================= */}
          <div className="absolute inset-0 backface-hidden [transform:rotateY(0deg)_translateZ(1px)]">
            <div
              className="relative h-full w-full overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.25)]
              "
            >
              {/* Top: logo note : relative z-20 flex items-center justify-center pt-8 */}
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="relative h-24 w-[250px]">
                  <Image
                    src={logoSrc}
                    alt={`${company} front-logo`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Person (ชิดล่าง) */}
              {/* <div className="absolute inset-x-0 bottom-0 z-0 flex justify-center">
                <div className="relative h-[340px] w-[270px]">
                  <Image
                    src={personSrc}
                    alt={name}
                    fill
                    className="object-contain object-bottom"
                    priority
                  />
                </div>
              </div> */}

              {/* Info pill (glass) */}
              {/* <div className="absolute bottom-5 left-4 right-4 z-30">
                <div className="relative overflow-hidden rounded-2xl bg-[#1a1f23]/40 px-4 py-3 text-center text-white backdrop-blur-xs shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
               
                  <div className="pointer-events-none absolute -top-10 left-1/2 h-24 w-72 -translate-x-1/2 rounded-full bg-white/25 blur-2xl" />

                  <div className="relative">
                    <div className="text-[18px] font-semibold leading-tight">
                      {name}
                    </div>
                    <div className="mt-1 text-[12px] leading-snug text-white/90">
                      {title}
                    </div>
                    <div className="mt-1 text-[14px] leading-snug text-white/80">
                      {company}
                    </div>
                  </div>
                </div>
              </div> */}

              {/* border */}
              {/* <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-black/10" /> */}
            </div>
          </div>

          {/* ================= BACK ================= */}
          <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)_translateZ(1px)]">
            <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#121a22] shadow-[0_18px_50px_rgba(0,0,0,0.35)] border-[#2d2d2d] border-2">
              <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
                <div className="relative h-14 w-[200px] opacity-95">
                  <Image
                    src={logoB}
                    alt={`${company} back-logo`}
                    fill
                    className="object-contain"
                  />
                </div>

                <p className="mt-6 text-[16px] leading-relaxed text-white">
                  {intro || "ใส่ข้อความแนะนำตัว (intro) ตรงนี้ได้เลย"}
                </p>

                {/* <div className="mt-6 text-xs text-white/50">
                  Hover / Click เพื่อพลิกการ์ด
                </div> */}
              </div>

              {/* border */}
              <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/10" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
