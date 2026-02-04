import ArticleEditorClient from "./ArticleEditorClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");
  const id = String(p?.id || "");
  return <ArticleEditorClient locale={locale} adminKey={adminKey} id={id} />;
}
