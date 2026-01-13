import AdminCourseFormClient from "@/components/admin/courses/AdminCourseFormClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const safeLocale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");

  return (
    <AdminCourseFormClient
      mode="create"
      locale={safeLocale}
      adminKey={adminKey}
    />
  );
}
