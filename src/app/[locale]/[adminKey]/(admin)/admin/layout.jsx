import { redirect } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
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

  try {
    await requireAdmin();
  } catch (e) {
    redirect(
      `/${safeLocale}/${encodeURIComponent(adminKey || "")}/admin/login`,
    );
  }

  return (
    <div className="min-h-screen bg-[#071321] text-white">
      <div className="flex min-h-screen">
        <AdminSidebar
          locale={safeLocale}
          adminKey={String(adminKey || "")}
          title="Admin"
          subtitle={t?.adminSubtitle || "NEXT SKILLS Admin"}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar locale={safeLocale} adminKey={String(adminKey || "")} />

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
