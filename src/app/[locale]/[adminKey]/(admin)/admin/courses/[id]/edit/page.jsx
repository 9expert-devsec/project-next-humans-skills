// src/app/[locale]/[adminKey]/(admin)/admin/courses/[id]/edit/page.jsx
import CourseEditClient from "./CourseEditClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;

  const safeLocale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");
  const id = String(p?.id || "");

  return <CourseEditClient locale={safeLocale} adminKey={adminKey} id={id} />;
}
