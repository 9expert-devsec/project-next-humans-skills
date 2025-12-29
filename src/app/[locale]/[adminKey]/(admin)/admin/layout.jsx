// src/app/[locale]/[adminKey]/(admin)/admin/layout.jsx
import AdminTopbar from "@/components/admin/AdminTopbar";
import { MESSAGES } from "@/lib/i18n/messages";

export default async function AdminLayout({ children, params }) {
  const { locale, adminKey } = await params;

  const safeLocale = locale === "en" ? "en" : "th";
  const t = MESSAGES[safeLocale] || MESSAGES.th;

  return (
    <>
      <AdminTopbar
        locale={safeLocale}
        adminKey={String(adminKey || "")}
        title="Admin"
        subtitle={t?.adminSubtitle || "NEXT SKILLS Admin"}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
