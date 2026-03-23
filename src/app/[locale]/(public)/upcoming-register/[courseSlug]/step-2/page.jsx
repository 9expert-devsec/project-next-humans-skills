// src/app/[locale]/(public)/upcoming-register/[courseSlug]/step-2/page.jsx
import UpcomingRegisterStep2Client from "./UpcomingRegisterStep2Client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const courseSlug = decodeURIComponent(String(p?.courseSlug || "")).trim();
  return (
    <UpcomingRegisterStep2Client locale={locale} courseSlug={courseSlug} />
  );
}
