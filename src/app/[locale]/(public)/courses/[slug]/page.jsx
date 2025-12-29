// src/app/[locale]/(public)/courses/[slug]/page.jsx
import Link from "next/link";
import CoursePublicDetailClient from "./CoursePublicDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCourse(slug) {
  // ✅ เรียกแบบ relative path ชัวร์สุด ไม่หลุดไป deployment อื่น
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || ""
    }/api/public/courses/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  ).catch(() => null);

  if (!res || !res.ok) return null;

  const data = await res.json().catch(() => ({}));
  return data?.ok ? data.item : null;
}

export default async function Page({ params }) {
  const { locale, slug } = params || {};
  const safeLocale = locale === "en" ? "en" : "th";

  const safeSlug = decodeURIComponent(String(slug || "")).trim();
  const course = safeSlug ? await getCourse(safeSlug) : null;

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-2xl font-extrabold">Course not found</h1>
        <p className="mt-2 text-white/60">
          อาจยังไม่ published หรือปิดการใช้งาน หรือ API คืน ok:false
        </p>
        <Link
          href={`/${safeLocale}`}
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // ✅ ใช้ client component ของคุณแสดงผล + curriculum/partners ได้เลย
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <CoursePublicDetailClient locale={safeLocale} course={course} />
    </div>
  );
}
