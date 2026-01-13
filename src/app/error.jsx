// src/app/error.jsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export const metadata = {
  title: "500 | Something went wrong - The Next Humans Skills",
  description: "An unexpected error occurred.",
  robots: { index: false, follow: false },
};

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // log ไว้ debug (จะต่อ Sentry / Log service ทีหลังก็ได้)
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1C2C] px-6">
      <div className="max-w-xl text-center text-white">
        <div className="text-6xl font-extrabold">500</div>

        <h1 className="mt-4 text-2xl font-bold">เกิดข้อผิดพลาดบางอย่าง</h1>

        <p className="mt-3 text-white/70">
          ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {/* reset = retry route เดิม */}
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
          >
            ลองใหม่อีกครั้ง
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 hover:bg-white/20"
          >
            กลับหน้าแรก
          </Link>
        </div>

        {/* Debug (เฉพาะ dev) */}
        {process.env.NODE_ENV === "development" && error?.message ? (
          <pre className="mt-6 rounded-xl bg-black/30 p-4 text-left text-xs text-white/70 overflow-auto">
            {error.message}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
