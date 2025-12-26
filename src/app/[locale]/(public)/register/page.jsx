// src/app/[locale]/(public)/register/page.jsx
import { redirect } from "next/navigation";

async function resolveCourseToId(course, origin) {
  const raw = String(course || "").trim();
  if (!raw) return null;

  // ถ้าเป็น ObjectId อยู่แล้ว ให้ผ่านเลย
  if (/^[a-f\d]{24}$/i.test(raw)) return raw;

  // ถ้าเป็น slug -> ยิงไปหา API slug เพื่อเอา _id
  const url = `${origin}/api/public/courses/${encodeURIComponent(raw)}`;
  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  const data = await res?.json().catch(() => ({}));
  return data?.ok ? data?.item?._id : null;
}

export default async function Page({ params, searchParams }) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "th";

  // query ที่หน้า course detail ส่งมา: ?course=...
  const course = searchParams?.course;

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const id = await resolveCourseToId(course, origin);

  // ถ้าไม่มี course ก็พาไปหน้าแรก (หรือจะทำ UI เลือกคอร์สก็ได้)
  if (!id) redirect(`/${safeLocale}`);

  redirect(`/${safeLocale}/register/${id}/step-1`);
}
