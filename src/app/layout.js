// src/app/layout.js
import "./globals.css";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import VercelSpeedInsightsClient from "@/components/VercelSpeedInsightsClient";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.thenexthumansskills.com",
  ),

  title: "The Next Humans Skills - สร้างทักษะให้เป็นบุคลากรในโลกยุคใหม่",
  description:
    "พัฒนาทักษะบุคลากรยุคดิจิทัลยุคใหม่ โดยผู้เชี่ยวชาญจาก 9Expert, Key Solutions และ Bitkub Academy ครอบคลุม AI, Data Analytics, Blockchain, Web3 และ Leadership Skills สำหรับผู้บริหารและบุคลากรทุกระดับ",

  keywords: [
    "อบรม AI",
    "พัฒนาทักษะดิจิทัล",
    "Blockchain Training",
    "Leadership Skills",
    "Data Analytics",
    "อบรมผู้บริหาร",
    "พัฒนาบุคลากร",
    "Soft Skills Training",
    "Digital Transformation",
  ],

  robots: {
    index: true,
    follow: true,
  },

  authors: [{ name: "The Next Humans Skills" }],

  other: {
    language: "Thai",
    "revisit-after": "7 days",
    "geo.region": "TH",
    "geo.placename": "Thailand",
  },
};

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-WXWZ2MFN";

  const jsonLdEducationalOrg = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "The Next Humans Skills",
    description:
      "แพลตฟอร์มอบรมและพัฒนาทักษะยุคใหม่ ครอบคลุม AI, Data Analytics, Blockchain และ Leadership Skills",
    url: "https://www.thenexthumansskills.com/th",
    logo: "https://www.thenexthumansskills.com/logo.png",
    image: "https://www.thenexthumansskills.com/banner.jpg",
    telephone: "+66-2-219-4304",
    email: "training@9expert.co.th",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressRegion: "Bangkok",
    },
    sameAs: ["https://www.facebook.com/thenexthumansskills"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "หลักสูตรฝึกอบรม",
      itemListElement: [
        {
          "@type": "Course",
          name: "Strategic Leadership in Digital Economy",
          description: "หลักสูตรสำหรับผู้บริหารระดับสูง",
          provider: { "@type": "Organization", name: "The Next Humans Skills" },
        },
        {
          "@type": "Course",
          name: "Data-Driven & Strategic Communication",
          description: "หลักสูตรสำหรับผู้บริหารระดับกลาง",
          provider: { "@type": "Organization", name: "The Next Humans Skills" },
        },
        {
          "@type": "Course",
          name: "AI, Automation & Blockchain for Innovators",
          description: "หลักสูตรสำหรับพนักงานสายธุรกิจ",
          provider: { "@type": "Organization", name: "The Next Humans Skills" },
        },
      ],
    },
  };

  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Next Humans Skills",
    url: "https://www.thenexthumansskills.com/th",
    potentialAction: {
      "@type": "SearchAction",
      target:
        "https://www.thenexthumansskills.com/th/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Next Humans Skills",
    url: "https://www.thenexthumansskills.com",
    founder: [
      {
        "@type": "Person",
        name: "Suchart Pavasiriporn",
        jobTitle: "CEO",
        worksFor: { "@type": "Organization", name: "Bitkub Labs" },
      },
      {
        "@type": "Person",
        name: "ชไลเวท พิพัฒพรรณวงศ์",
        jobTitle: "CEO",
        worksFor: { "@type": "Organization", name: "9Expert Training" },
      },
      {
        "@type": "Person",
        name: "ทรงศักดิ์ พุ่มสวัสดิ์",
        jobTitle: "CEO",
        worksFor: { "@type": "Organization", name: "Key Solutions Training" },
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+66-2-219-4304",
        contactType: "Customer Service",
        areaServed: "TH",
        availableLanguage: "Thai",
      },
    ],
  };

  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {GTM_ID && (
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        )}

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        )}

        <Script
          id="jsonld-educational-org"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdEducationalOrg),
          }}
        />
        <Script
          id="jsonld-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
        <Script
          id="jsonld-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrganization),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {GA_ID && <AnalyticsProvider />}

        {children}

        <VercelSpeedInsightsClient />
      </body>
    </html>
  );
}
