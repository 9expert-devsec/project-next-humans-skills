// src/app/[locale]/(public)/layout.jsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import localFont from "next/font/local";

const lineSeedSansTH = localFont({
  src: [
    { path: "../../../../public/fonts/LINESeedSansTH_W_Rg.woff2", weight: "400", style: "normal" },
    { path: "../../../../public/fonts/LINESeedSansTH_W_Bd.woff2", weight: "700", style: "normal" },
    { path: "../../../../public/fonts/LINESeedSansTH_W_XBd.woff2", weight: "800", style: "normal" },
    { path: "../../../../public/fonts/LINESeedSansTH_W_He.woff2", weight: "900", style: "normal" },
    // ถ้าจะใช้ Thin เพิ่มด้วย
    { path: "../../../../public/fonts/LINESeedSansTH_W_Th.woff2", weight: "200", style: "normal" },
  ],
  display: "swap",
});

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
      <main className={`${lineSeedSansTH.className} bg-[#0B1C2C] ns-container`}>{children}</main>

      {/* Footer เต็มจอ แต่ข้างในกลาง */}
      <footer className="w-full">
        <div className="ns-container">
          <Footer locale={safeLocale} />
        </div>
      </footer>
    </>
  );
}
