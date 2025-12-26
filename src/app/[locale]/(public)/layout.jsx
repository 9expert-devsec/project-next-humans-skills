// src/app/[locale]/(public)/layout.jsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default async function PublicLayout({ children, params }) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "th";

  return (
    <>
      {/* Header เต็มจอ แต่ข้างในกลาง */}
      <header className="w-full">
        <div className="ns-container">
          <Header locale={safeLocale} />
        </div>
      </header>

      {/* เนื้อหาหน้ากลาง */}
      <main className="ns-container">{children}</main>

      {/* Footer เต็มจอ แต่ข้างในกลาง */}
      <footer className="w-full">
        <div className="ns-container">
          <Footer locale={safeLocale} />
        </div>
      </footer>
    </>
  );
}
