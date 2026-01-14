// src/app/not-found.jsx
import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1C2C] px-6">
      <div className="max-w-xl text-center text-white">
        <div className="text-7xl font-extrabold">404</div>

        <h1 className="mt-4 text-2xl font-bold">ไม่พบหน้าที่คุณต้องการ</h1>

        <p className="mt-3 text-white/70">
          หน้านี้อาจถูกลบ เปลี่ยนชื่อ หรือยังไม่เปิดใช้งาน
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {/* โปรเจกต์คุณใช้ locale route → ไม่ควรลิงก์ไป "/" */}
          <Link
            href="/th"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
          >
            กลับหน้าแรก
          </Link>

          <Link
            href="/en"
            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 hover:bg-white/20"
          >
            English Home
          </Link>
        </div>
      </div>
    </div>
  );
}
