import AdminDashboardClient from "./AdminDashboardClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ params }) {
  const { locale } = await params; // ✅ สำคัญ
  return <AdminDashboardClient locale={locale} />;
}
