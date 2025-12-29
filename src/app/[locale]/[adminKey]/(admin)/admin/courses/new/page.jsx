import AdminCourseFormClient from "@/components/admin/courses/AdminCourseFormClient";

export default async function Page({ params }) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "th";
  return <AdminCourseFormClient locale={safeLocale} />;
}
