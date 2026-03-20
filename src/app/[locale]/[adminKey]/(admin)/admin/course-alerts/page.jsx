import CourseAlertsClient from "./CourseAlertsClient";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = p?.adminKey || "";

  return (
    <>
      <CourseAlertsClient locale={locale} adminKey={adminKey} />
    </>
  );
}
