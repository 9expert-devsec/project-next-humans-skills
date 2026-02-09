// src/app/[locale]/(public)/layout.jsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import localFont from "next/font/local";

const lineSeedSansTH = localFont({
  src: [
    {
      path: "../../../../public/fonts/LINESeedSansTH_W_Rg.woff2",
      weight: "400",
    },
    {
      path: "../../../../public/fonts/LINESeedSansTH_W_Bd.woff2",
      weight: "700",
    },
    {
      path: "../../../../public/fonts/LINESeedSansTH_W_XBd.woff2",
      weight: "800",
    },
    {
      path: "../../../../public/fonts/LINESeedSansTH_W_He.woff2",
      weight: "900",
    },
    {
      path: "../../../../public/fonts/LINESeedSansTH_W_Th.woff2",
      weight: "200",
    },
  ],
  display: "swap",
});

export default async function PublicLayout({ children, params }) {
  const p = await params;
  const safeLocale = p?.locale === "en" ? "en" : "th";

  return (
    <>
      <header className="w-full">
        <div className={lineSeedSansTH.className}>
          <Header locale={safeLocale} />
        </div>
      </header>

      <main className={`${lineSeedSansTH.className} bg-[#0B1C2C]`}>
        {children}
      </main>

      <footer className="w-full">
        <div className={`${lineSeedSansTH.className} max-w-7xl mx-auto`}>
          <Footer locale={safeLocale} />
        </div>
      </footer>
    </>
  );
} 
