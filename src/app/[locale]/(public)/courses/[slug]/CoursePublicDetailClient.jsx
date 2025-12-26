// src/app/[locale]/(public)/courses/[slug]/CoursePublicDetailClient.jsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

export default function CoursePublicDetailClient({ locale = "th", course }) {
  const isEN = locale === "en";

  // ✅ map field ให้ตรงกับ schema ใหม่ (และกัน null)
  const slug = String(course?.slug || "");
  const title =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "Untitled";

  const short = course?.short_description || course?.short || "";

  // ถ้าคุณยังไม่มี field detail โดยตรง ให้เอาจาก rationale ไปก่อน
  const detail =
    course?.detail_th ||
    course?.detail_en ||
    course?.detail ||
    course?.content?.rationale ||
    "";

  const coverUrl =
    course?.cover_image || course?.cover || course?.coverUrl || "";

  const registerHref = useMemo(() => {
    return `/${locale}/register?course=${encodeURIComponent(slug)}`;
  }, [locale, slug]);

  const priceText = useMemo(() => {
    const amt = Number(course?.business?.price_amount || 0);
    const cur = course?.business?.price_currency || "THB";
    if (!amt) return isEN ? "Contact for pricing" : "สอบถามราคา";
    return `${amt.toLocaleString()} ${cur}`;
  }, [course, isEN]);

  const priceNote = useMemo(() => {
    // ถ้าคุณอยากทำ note ไทย/อังกฤษในอนาคตค่อยเพิ่มได้
    return course?.priceNote || course?.business?.price_note || "";
  }, [course]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT */}
      <div className="lg:col-span-8">
        <div className="mb-4 text-sm text-white/60">
          <Link className="hover:text-white" href={`/${locale}`}>
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-white" href={`/${locale}/courses`}>
            Courses
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">{title}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title}
              className="h-[240px] w-full object-cover md:h-[320px]"
            />
          ) : (
            <div className="h-[240px] w-full bg-white/5 md:h-[320px]" />
          )}

          <div className="p-5 md:p-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              {title}
            </h1>

            {short ? (
              <p className="mt-3 text-white/70 whitespace-pre-wrap">{short}</p>
            ) : null}

            {detail ? (
              <div className="mt-5 whitespace-pre-wrap leading-relaxed text-white/70">
                {detail}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">
              {isEN ? "Price" : "ราคา"}
            </div>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {priceText}
            </div>

            {priceNote ? (
              <div className="mt-2 text-sm text-white/60">{priceNote}</div>
            ) : null}

            <Link
              href={registerHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
            >
              {isEN ? "Register" : "ลงทะเบียน"}
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
