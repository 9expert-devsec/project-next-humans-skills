// src/app/[locale]/[adminKey]/(admin)/admin/courses/page.jsx
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminCoursesClient from "./AdminCoursesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;

  const safeLocale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");

  return (
    <>
      <AdminTopbar
        title="Courses"
        subtitle="จัดการคอร์สทั้งหมด"
        locale={safeLocale}
        adminKey={adminKey}
      />
      <AdminCoursesClient locale={safeLocale} adminKey={adminKey} />
    </>
  );
}
