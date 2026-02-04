import NewArticleClient from "./NewArticleClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");
  return <NewArticleClient locale={locale} adminKey={adminKey} />;
}
