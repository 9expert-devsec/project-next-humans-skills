// src/app/[locale]/(admin)/admin/courses/[id]/edit/page.jsx
import CourseEditClient from "./CourseEditClient";

export default async function Page({ params }) {
  const { locale, id } = await params;

  const safeLocale = locale === "en" ? "en" : "th";
  return <CourseEditClient locale={safeLocale} id={id} />;
}
