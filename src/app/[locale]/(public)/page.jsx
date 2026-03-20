// src/app/[locale]/(public)/page.jsx
import Image from "next/image";

import CourseGridClient from "@/components/ui/CourseGridClient";
import ProfileFlipCard from "@/components/cards/ProfileFlipCard";
import AudiencePill from "@/components/cards/AudiencePill";
import NewsMediaPanelClient from "@/components/public/NewsMediaPanelClient";
import UpcomingClassesClient from "@/components/ui/UpcomingClassesClient";
import ScrollToUpcomingButton from "@/components/ui/ScrollToUpcomingButton";

import { Crown, Briefcase, Leaf } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- SEO: Home Metadata ---------------- */
export async function generateMetadata({ params }) {
  const p = params;
  const locale = p?.locale === "en" ? "en" : "th";
  const isEN = locale === "en";

  const title = isEN
    ? "The Next Humans Skills | Training & Leadership Programs"
    : "The Next Humans Skills | แพลตฟอร์มอบรมและพัฒนาทักษะยุคใหม่";

  const description = isEN
    ? "A modern training-registration platform by 9Expert Training, Key Solutions Training, and Bitkub Academy. Explore leadership, AI, data, and digital skills programs."
    : "แพลตฟอร์มลงทะเบียนอบรมยุคใหม่ โดย 9Expert Training, Key Solutions Training และ Bitkub Academy รวมหลักสูตรผู้นำ AI Data และทักษะดิจิทัล";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.thenexthumansskills.com";
  const url = `${baseUrl}/${locale}`;

  // แนะนำทำไฟล์ OG แยก 1200x630 ที่ public/og/home-og.png
  // ถ้ายังไม่มี ใช้ banner ที่มีอยู่ก็ได้
  const ogImage = `${baseUrl}/og/home-og.png`;

  return {
    metadataBase: new URL(baseUrl),

    title,
    description,

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: url,
      languages: {
        th: `${baseUrl}/th`,
        en: `${baseUrl}/en`,
      },
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "The Next Humans Skills",
      locale: isEN ? "en_US" : "th_TH",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const isEN = locale === "en";

  const handleScroll = () => {
    document.getElementById("upcoming-classes")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const t = {
    title: isEN ? "NEXT SKILLS" : "NEXT SKILLS",
    subtitle: isEN
      ? "Training registration + admin-ready management"
      : "ระบบลงทะเบียนอบรม + หลังบ้านจัดการ (โทนทันสมัย)",
    cta1: isEN ? "Browse Courses" : "ดูคอร์สแนะนำ",
    cta2: isEN ? "Go to Admin" : "ไปหน้าแอดมิน",
    newsTitle: isEN ? "News" : "ข่าวประชาสัมพันธ์",
    newsDesc: isEN
      ? "Updates, events, and highlights from our partners"
      : "อัปเดตกิจกรรม ข่าวสาร และไฮไลต์จากพาร์ทเนอร์",
    courseTitle: isEN ? "Courses" : "หลักสูตร",
    courseDesc: isEN ? "Latest courses available" : "คอร์สที่เปิดใช้งานล่าสุด",
  };

  const Audience_ITEMS = [
    { label: "ผู้บริหารระดับสูง", icon: Crown },
    { label: "ผู้นำระดับกลาง", icon: Briefcase },
    { label: "พนักงานยุคใหม่", icon: Leaf },
  ];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thenexthumansskills.com";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Next Humans Skills",
      url: `${siteUrl}/${locale}`,
      logo: `${siteUrl}/icon.ico`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "The Next Humans Skills",
      url: siteUrl,
      inLanguage: locale,
    },
  ];

  return (
    <>
      {/* ✅ H1 สำหรับ SEO (ไม่กระทบ UI) */}
      <h1 className="sr-only">
        {isEN
          ? "The Next Humans Skills — Developing digital-era workforce skills to prepare for the future"
          : "The Next Humans Skills - พัฒนาทักษะบุคลากรยุคดิจิทัลพร้อมรับอนาคต"}
      </h1>

      {/* ✅ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section id="banner" className="mx-auto mt-24 max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src="/banner-landingpage-thenexthumansskills3.png"
            alt="The Next Humans Skills"
            width={1600}
            height={600}
            className="h-auto w-full rounded-3xl border border-white/10"
            priority
          />

          <div className="absolute left-6 bottom-6 z-20 md:left-10 md:bottom-10 lg:left-20 lg:bottom-14">
            <ScrollToUpcomingButton />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="text-white text-3xl font-bold text-center sm:text-4xl">
            โดย 3 องค์กร
          </div>
          <div className="text-white text-2xl font-semibold text-center sm:text-3xl mt-3">
            ที่มีความเชี่ยวชาญ
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-1 lg:grid-cols-3 justify-items-center">
            <ProfileFlipCard
              logoSrc="/logo/bitkub-black.png"
              logoB="/logo/bitkub-white.png"
              personSrc="/people/k-stamp.png"
              name="คุณกันตณัฐ วุฒิธร"
              title="ผู้ช่วยผู้จัดการฝ่ายวิเคราะห์สินทรัพย์ดิจิทัล"
              company="บริษัท บิทคับ แล็บส์ จำกัด"
              intro="ผู้เชี่ยวชาญด้านสินทรัพย์ดิจิทัล เทคโนโลยีบล็อกเชน และ Web3 ที่มุ่งสร้างความเข้าใจเชิงลึกเกี่ยวกับ Digital Assets และโครงสร้างเศรษฐกิจดิจิทัลยุคใหม่"
            />
            <ProfileFlipCard
              logoSrc="/logo/9Expert.svg"
              logoB="/logo/9Expert.svg"
              personSrc="/people/k-chalaivate.png"
              name="คุณชไลเวท พิพัฒพรรณวงศ์"
              title="ประธานเจ้าหน้าที่บริหาร"
              company="บริษัท นายน์เอ็กซ์เพิร์ท จำกัด"
              intro="ผู้เชี่ยวชาญด้านเทคโนโลยีปัญญาประดิษฐ์ (AI) และ Data ที่เน้นการนำ AI และข้อมูลมาประยุกต์ใช้จริงในการทำงาน การตัดสินใจ และการเพิ่มประสิทธิภาพองค์กร"
            />
            <ProfileFlipCard
              logoSrc="/logo/key-solutions-black.svg"
              logoB="/logo/key-solutions-white.svg"
              personSrc="/people/k-pop.png"
              name="คุณทรงศักดิ์ พุ่มสวัสดิ์"
              title="ประธานเจ้าหน้าที่บริหาร"
              company="บริษัท คีย์โซลูชั่นเทรนนิ่ง จำกัด"
              intro="ผู้เชี่ยวชาญด้านการพัฒนาซอฟต์สกิล การพัฒนาศักยภาพบุคลากร และการยกระดับองค์กร เพื่อเสริมสร้างทักษะด้านความคิด การสื่อสารและภาวะผู้นำ"
            />
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#0B1C2C] py-40">
        <div aria-hidden className="orb-layer">
          <span
            className="bg-orb orb-green"
            style={{
              "--orb-size": "350px",
              "--orb-blur": "50px",
              "--orb-x": "55%",
              "--orb-y": "45%",
            }}
          />
          <span
            className="bg-orb orb-blue"
            style={{
              "--orb-size": "350px",
              "--orb-blur": "50px",
              "--orb-x": "55%",
              "--orb-y": "65%",
            }}
          />
          <span
            className="bg-orb orb-yellow"
            style={{
              "--orb-size": "350px",
              "--orb-blur": "50px",
              "--orb-x": "43%",
              "--orb-y": "40%",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-10 sm:py-0 sm:px-4 flex flex-col gap-10 sm:gap-14">
          <div className="text-white font-bold self-center text-center lg:self-start lg:text-left">
            <span className="text-4xl sm:text-6xl">People </span>
            <span className="text-xl sm:text-3xl ">
              ไม่ได้มีบทบาทเพื่อใช้เครื่องมือ
            </span>
          </div>
          <div className="text-white font-bold self-center text-center lg:self-start lg:text-left ml-0 lg:ml-56">
            <span className="text-xl sm:text-3xl ">แต่ต้องกำหนด</span>
            <span className="text-4xl sm:text-6xl pl-4">Data</span>
          </div>
          <div className="text-white font-bold self-center text-center">
            <span className="text-xl sm:text-3xl ">และขับเคลื่อน</span>
            <span className="text-4xl sm:text-6xl pl-4">Technology</span>
          </div>
          <div className="text-white font-bold self-center text-center lg:self-end lg:text-right">
            <span className="text-xl sm:text-3xl ">เพื่อสร้าง</span>
            <span className="text-4xl sm:text-6xl pl-4">Strategy </span>
            <span className="text-xl sm:text-3xl ">ให้องค์กร</span>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1C2C] text-center text-white text-xl sm:text-2xl flex items-center justify-center py-16 px-8 gap-5 flex-col">
        <span>มุ่งเน้นการออกแบบหลักสูตรที่สามารถนำไปใช้งานได้จริงในองค์กร</span>
        <span>
          ไม่ว่าจะเป็นการพัฒนาผู้นำเชิงกลยุทธ์ การยกระดับศักยภาพบุคลากร
        </span>
        <span>
          รวมถึงการสร้างวัฒนธรรมการทำงานที่พร้อมรับการเปลี่ยนแปลงอย่างต่อเนื่อง
        </span>
      </section>

      <section className="bg-[#0B1C2C] flex items-center justify-center py-15 px-8 gap-10 flex-col">
        <div className="text-white text-center text-lg sm:text-xl">
          พัฒนาศักยภาพบุคลากรทุกระดับตั้งแต่
        </div>
        <div className="flex flex-col items-center gap-4 w-full">
          {Audience_ITEMS.map((item) => (
            <AudiencePill
              key={item.label}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
        <div className="text-white text-center text-xl sm:text-2xl">
          เพื่อสร้างองค์กรที่มีความยืดหยุ่น พร้อมปรับตัว
          และเติบโตอย่างยั่งยืนในยุค Digital
        </div>
      </section>

      <section id="upcoming-classes" className="section">
        <h2 className="text-center text-white text-4xl font-semibold">
          {isEN ? "Upcoming Classes" : "คลาสที่กำลังจะมาถึง"}
        </h2>

        {/* <div className="mt-3 text-center text-white/70">
          {isEN
            ? "Public rounds with scheduled dates — register directly."
            : "รอบอบรมแบบ Public ที่กำหนดวันไว้แล้ว — เลือกลงทะเบียนได้ทันที"}
        </div> */}

        <div className="panel mt-8">
          <UpcomingClassesClient locale={locale} limit={4} />
        </div>
      </section>

      <section id="courses" className="section">
        <h2 className="text-center text-white text-4xl font-semibold">
          {t.courseTitle}
        </h2>

        <div className="panel">
          <CourseGridClient locale={locale} limit={4} />
        </div>
      </section>

      {/* ✅ News / Media */}
      <section id="news" className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="text-white text-4xl font-bold">{t.newsTitle}</div>
        {/* <div className="mt-2 text-white/70 text-lg">{t.newsDesc}</div> */}

        <div className="mt-10">
          <NewsMediaPanelClient locale={locale} />
        </div>
      </section>
    </>
  );
}
