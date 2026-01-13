// src/app/[locale]/[adminKey]/(admin)/admin/layout.jsx
import { redirect } from "next/navigation";

import AdminTopbar from "@/components/admin/AdminTopbar";
import { MESSAGES } from "@/lib/i18n/messages";
import { requireAdmin } from "@/lib/adminAuth.server";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function AdminLayout({ children, params }) {
  const { locale, adminKey } = await params;

  const safeLocale = locale === "en" ? "en" : "th";
  const t = MESSAGES[safeLocale] || MESSAGES.th;

  // ✅ บังคับต้องเป็นแอดมิน (ถ้าไม่ผ่าน -> เด้งไปหน้า login)
  try {
    await requireAdmin();
  } catch (e) {
    redirect(
      `/${safeLocale}/${encodeURIComponent(adminKey || "")}/admin/login`
    );
  }

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
