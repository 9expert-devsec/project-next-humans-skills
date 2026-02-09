import ArticlesListClient from "./ArticlesListClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");
  return <ArticlesListClient locale={locale} adminKey={adminKey} />;
}
