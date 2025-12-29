// src/app/[locale]/admin/courses/page.jsx
import AdminCoursesClient from "./AdminCoursesClient";

export default async function Page({ params }) {
  const p = await params; // ✅ unwrap
  return <AdminCoursesClient locale={p.locale} />;
}
