// src/app/[locale]/(public)/register/[courseSlug]/step-1/page.jsx
import RegisterStep1Client from "./RegisterStep1Client";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { locale, courseSlug } = await params;
  const safeLocale = locale === "en" ? "en" : "th";
  return <RegisterStep1Client locale={safeLocale} courseSlug={courseSlug} />;
}
