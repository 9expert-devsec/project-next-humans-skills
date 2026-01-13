import AdminLoginClient from "./AdminLoginClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = String(p?.adminKey || "");

  return <AdminLoginClient locale={locale} adminKey={adminKey} />;
}
