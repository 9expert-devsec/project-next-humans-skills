import AdminLoginClient from "./AdminLoginClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ params }) {
  const { locale } = await params; // ✅ สำคัญ

  return <AdminLoginClient locale={locale} />;
}
