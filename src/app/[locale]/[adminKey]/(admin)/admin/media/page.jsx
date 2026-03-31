import MediaAdminClient from "./MediaAdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";

  return <MediaAdminClient locale={locale} />;
}
