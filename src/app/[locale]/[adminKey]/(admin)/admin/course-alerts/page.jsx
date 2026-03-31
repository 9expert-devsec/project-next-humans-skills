import CourseAlertsClient from "./CourseAlertsClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");

  return <CourseAlertsClient locale={locale} adminKey={adminKey} />;
}
