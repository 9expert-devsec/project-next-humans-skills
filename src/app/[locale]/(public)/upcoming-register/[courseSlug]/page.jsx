// src/app/[locale]/(public)/upcoming-register/[courseSlug]/page.jsx
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const courseSlug = decodeURIComponent(String(p?.courseSlug || "")).trim();
  if (!courseSlug) redirect(`/${locale}`);
  redirect(
    `/${locale}/upcoming-register/${encodeURIComponent(courseSlug)}/step-1`,
  );
}
