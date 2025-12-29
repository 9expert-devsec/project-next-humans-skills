// src/app/[locale]/(public)/courses/[slug]/page.jsx
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import CoursePublicDetailClient from "./CoursePublicDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCourse(c) {
  if (!c) return null;
  return {
    _id: String(c._id),
    slug: c.slug || "",
    title_th: c.title_th || "",
    title_en: c.title_en || "",
    short_description: c.short_description || "",
    cover_image: c.cover_image || "",
    level: c.level || "general",
    duration_days: c.duration_days || 1,
    status: c.status || "draft",
    isActive: !!c.isActive,

    content: c.content || {},
    curriculum: Array.isArray(c.curriculum) ? c.curriculum : [],
    executive_summary: c.executive_summary || "",
    highlight_modules: Array.isArray(c.highlight_modules)
      ? c.highlight_modules
      : [],
    key_takeaways: Array.isArray(c.key_takeaways) ? c.key_takeaways : [],
    business: c.business || {},
    tags: Array.isArray(c.tags) ? c.tags : [],
    partners: Array.isArray(c.partners) ? c.partners : [],
  };
}

export default async function Page({ params }) {
  const { locale, slug } = params || {};
  const safeLocale = locale === "en" ? "en" : "th";
  const safeSlug = decodeURIComponent(String(slug || "")).trim();

  if (!safeSlug) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-2xl font-extrabold">Course not found</h1>
        <p className="mt-2 text-white/60">missing slug</p>
        <Link
          href={`/${safeLocale}`}
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  await dbConnect();

  // ✅ เหมือน API ของคุณ: ต้อง isActive=true และ status=published
  const item = await Course.findOne({
    slug: safeSlug,
    isActive: true,
    status: "published",
  }).lean();

  const course = normalizeCourse(item);

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-2xl font-extrabold">Course not found</h1>
        <p className="mt-2 text-white/60">
          ไม่เจอใน DB (slug ไม่ตรง / ยังไม่ published / isActive=false)
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

  return (
    <div className="text-white text-xs opacity-70">ROUTE_MARK_2025_12_29</div>,
    
    <div className="mx-auto max-w-6xl px-4 py-12">
      <CoursePublicDetailClient locale={safeLocale} course={course} />
    </div>
  );
}
