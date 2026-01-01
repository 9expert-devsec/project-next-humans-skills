import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseGridClient from "@/components/ui/CourseGridClient";
import HeroIllustration from "@/components/public/HeroIllustration";
import ProfileFlipCard from "@/components/cards/ProfileFlipCard";
import ConceptPill from "@/components/cards/ConceptPill";
import AudiencePill from "@/components/cards/AudiencePill";
import CourseCard from "@/components/cards/CourseCard";

import { Crown, Briefcase, Leaf } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const isEN = locale === "en";

  const t = {
    title: isEN ? "NEXT SKILLS" : "NEXT SKILLS",
    subtitle: isEN
      ? "Training registration + admin-ready management"
      : "ระบบลงทะเบียนอบรม + หลังบ้านจัดการ (โทนทันสมัย)",
    cta1: isEN ? "Browse Courses" : "ดูคอร์สแนะนำ",
    cta2: isEN ? "Go to Admin" : "ไปหน้าแอดมิน",
    newsTitle: isEN ? "News / Media" : "ข่าวสาร / สื่อ",
    newsDesc: isEN
      ? "Space for image/video slides (admin can manage later)"
      : "พื้นที่สำหรับสไลด์รูปภาพ/วิดีโอ (เพิ่มทีหลังได้)",
    courseTitle: isEN ? "Courses" : "หลักสูตร",
    courseDesc: isEN ? "Latest courses available" : "คอร์สที่เปิดใช้งานล่าสุด",
  };

  const ITEMS = [
    { label: "People", icon: "users" },
    { label: "Data", icon: "bar" },
    { label: "Technology", icon: "cpu" },
    { label: "Strategy", icon: "compass" },
  ];

  const Audience_ITEMS = [
    { label: "ผู้บริหารระดับสูง", icon: Crown },
    { label: "ผู้นำระดับกลาง", icon: Briefcase },
    { label: "พนักงานยุคใหม่", icon: Leaf },
  ];

  const COURSES = [
    {
      title: "The Next-Gen Strategic Leadership in the Digital Era Economy",
      coverSrc: "", // ใส่ path รูปทีหลังได้
      tags: ["Tag", "Citizen"],
      href: "#",
    },
    {
      title: "The Next-Step Data-Driven Leadership & Strategic Communication",
      coverSrc: "",
      tags: ["Tag", "Citizen"],
      href: "#",
    },
    {
      title: "The Next-Gen Innovator : AI, Automation and Blockchain",
      coverSrc: "",
      tags: ["Tag", "Citizen"],
      href: "#",
    },
    {
      title: "The Next Accelerator : Workforce AI & Financial Empowerment",
      coverSrc: "",
      tags: ["Tag", "Citizen"],
      href: "#",
    },
  ];

  return (
    <>
      {/* <Header locale={locale} /> */}

      {/* <main className="container"> */}
      {/* <section className="hero">
          <div className="heroCard">
            <div className="heroInner">
              <div>
                <h1 className="h1">{t.title}</h1>
                <div className="sub">{t.subtitle}</div>

                <div className="chips">
                  <span className="chip">
                    <span
                      className="dot"
                      style={{ background: "var(--acc-green)" }}
                    />
                    Blockchain • Data
                  </span>
                  <span className="chip">
                    <span
                      className="dot"
                      style={{ background: "var(--acc-blue)" }}
                    />
                    AI • Automation
                  </span>
                  <span className="chip">
                    <span
                      className="dot"
                      style={{ background: "var(--acc-yellow)" }}
                    />
                    Human • Growth
                  </span>
                </div>

                <div className="actions">
                  <a className="btn btnPrimary" href={`/${locale}#courses`}>
                    {t.cta1}
                  </a>
                  <a className="btn" href={`/${locale}/admin/login`}>
                    {t.cta2}
                  </a>
                </div>
              </div>

              <HeroIllustration />
            </div>
          </div>
        </section> */}

      <section id="banner" className="mx-auto max-w-7xl mt-24 ">
        <Image
          src="/banner-landingpage-thenexthumansskills2.png"
          alt="The Next Humans Skills"
          width={1600}
          height={600}
          className="w-full h-auto rounded-3xl border border-white/10"
          priority
        />
      </section>

      {/* <section
        id="banner"
        className="relative isolate min-h-140 overflow-hidden bg-[]#0B1C2C"
      >
        
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90"
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g filter="url(#filter0_f_22_56)">
            <path
              d="M-45.0006 710.965C-49.7757 718.824 -52.4865 728.069 -51.738 737.396C-50.9951 746.717 -46.9422 755.276 -40.2656 761.376C-33.5891 767.477 -24.7004 770.743 -15.3499 770.644C-5.99387 770.55 2.9698 767.018 10.3676 761.555C33.6278 744.482 56.806 728.485 80.4568 713.038C279.51 581.867 490.126 521.063 715.994 488.807C764.244 481.757 813.186 476.018 862.764 471.093C1097.13 458.247 1405.15 308.683 1441.21 37.5485C1446.64 5.45875 1448.62 -26.514 1447.87 -57.8503C1447.54 -67.1013 1444.58 -76.3388 1438.67 -83.6674C1432.76 -90.9949 1424.5 -95.7971 1415.45 -97.0512C1406.4 -98.3053 1397.14 -95.9324 1389.47 -90.4883C1381.78 -85.0452 1376.42 -76.9606 1373.58 -68.1497C1364.87 -42.0208 1354.43 -17.1348 1342.25 6.03043C1247.04 190.213 1049.79 233.469 847.158 241.284C792.338 243.451 737.195 248.215 682.015 256.277C424.502 289.91 160.79 424.431 6.79347 635.271C-11.8567 659.902 -28.9112 684.982 -45.0006 710.965Z"
              fill="url(#paint0_linear_22_56)"
            />
          </g>

          <defs>
            <filter
              id="filter0_f_22_56"
              x="-195.961"
              y="-241.479"
              width="1788.09"
              height="1156.23"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="72.05"
                result="effect1_foregroundBlur_22_56"
              />
            </filter>

            <linearGradient
              id="paint0_linear_22_56"
              x1="9.44726"
              y1="677.382"
              x2="1482.5"
              y2="11.4486"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B358" />
              <stop offset="0.514423" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#F6D62D" />
            </linearGradient>
          </defs>
        </svg>

        
        <div className="pointer-events-none absolute inset-0 z-10 bg-[#0B1C2C]/15" />

      
        <div className="relative z-20 mx-auto max-w-7xl px-6 py-[120px]">
          <h1 className="text-white text-[80px] font-bold leading-[88px]">
            THE NEXT <br /> HUMANS SKILLS
          </h1>
          <p className="mt-8 max-w-xl text-white/90 text-3xl leading-11">
            “คนไม่เพียงแค่ ใช้ AI <br />
            แต่ต้อง กำหนดทิศทาง <br />
            และใช้ AI อย่างมีกลยุทธ์”
          </p>
        </div>
      </section> */}

      <section className="py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="text-white text-3xl font-bold text-center sm:text-4xl">
            ผนึกกำลัง 3 องค์กร
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-1 lg:grid-cols-3 justify-items-center">
            <ProfileFlipCard
              logoSrc="/logo/bitkub-black.png"
              logoB="/logo/bitkub-white.png"
              personSrc="/people/k-sarp.png"
              name="คุณสุกฤษฎิ์ พุทธริยะ"
              title="ประธานเจ้าหน้าที่บริหาร"
              company="บริษัท บิทคับ แล็บส์ (Bitkub Labs) จำกัด"
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

      <section className="bg-[#0B1C2C] flex items-center justify-center py-20 px-8 gap-10 flex-col ">
        <div className="text-white text-2xl sm:text-4xl ">ออกแบบหลักสูตรที่เชื่อมโยง</div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 px-4">
          {ITEMS.map((item) => (
            <ConceptPill key={item.label} label={item.label} icon={item.icon} />
          ))}
        </div>
        <div className="text-white text-xl sm:text-3xl ">เข้าด้วยกันอย่างเป็นระบบ</div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#0B1C2C] py-40">
        {/* animated 3-color lights */}
        {/* <div aria-hidden className="orb-layer">
          <span className="bg-orb orb-green" />
          <span className="bg-orb orb-blue" />
          <span className="bg-orb orb-yellow" />
        </div> */}
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

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-10 sm:py-0 sm:px-12 flex flex-col items-center justify-center gap-10 sm:gap-14">
          <div className="text-white font-bold self-center text-center sm:self-start sm:text-left">
            <span className="text-xl sm:text-3xl ">&quot; คนไม่เพียงแค่</span>
            <span className="text-4xl sm:text-6xl pl-4">ใช้ AI</span>
          </div>
          <div className="text-white font-bold self-center text-center">
            <span className="text-xl sm:text-3xl ">แต่ต้อง</span>
            <span className="text-4xl sm:text-6xl pl-4">กำหนดทิศทาง</span>
          </div>
          <div className="text-white font-bold self-center text-center sm:self-end sm:text-right">
            <span className="text-xl sm:text-3xl ">และใช้ AI</span>
            <span className="text-4xl sm:text-6xl pl-4">อย่างมีกลยุทธ์ &quot;</span>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1C2C] text-center text-white text-xl sm:text-2xl flex items-center justify-center py-16 px-8 gap-5 flex-col ">
        <span >มุ่งเน้นการออกแบบหลักสูตรที่สามารถนำไปใช้งานได้จริงในองค์กร</span>
        <span>
          ไม่ว่าจะเป็นการพัฒนาผู้นำเชิงกลยุทธ์
          การยกระดับศักยภาพบุคลากรด้วยข้อมูล และ AI
        </span>
        <span>
          รวมถึงการสร้างวัฒนธรรมการทำงานที่พร้อมรับการเปลี่ยนแปลงอย่างต่อเนื่อง
        </span>
      </section>

      <section className="bg-[#0B1C2C] flex items-center justify-center py-15 px-8 gap-10 flex-col ">
        <div className="text-white text-center text-lg sm:text-xl ">
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
        <div className="text-white text-center text-xl  sm:text-2xl ">
          เพื่อสร้างองค์กรที่มีความยืดหยุ่น พร้อมปรับตัว
          และเติบโตอย่างยั่งยืนในยุค AI
        </div>
      </section>

      {/* <section id="courses" className="bg-[#0B1C2C] py-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <h2 className="text-center text-white text-4xl font-semibold">
            หลักสูตร
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {COURSES.map((c) => (
              <CourseCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section> */}

      {/* <section className="section">
          <h2 className="sectionTitle">{t.newsTitle}</h2>
          <div className="sectionDesc">{t.newsDesc}</div>

          <div className="panel">
            <div className="newsGrid">
              <div className="newsMain">
                {isEN
                  ? "News slider placeholder"
                  : "พื้นที่สไลด์ข่าว (placeholder)"}
              </div>
              <div className="newsSide">
                <div className="newsCard">
                  <b>{isEN ? "Highlight 1" : "ไฮไลต์ 1"}</b>
                  <span>
                    {isEN
                      ? "Short description here…"
                      : "คำอธิบายสั้น ๆ ตรงนี้…"}
                  </span>
                </div>
                <div className="newsCard">
                  <b>{isEN ? "Highlight 2" : "ไฮไลต์ 2"}</b>
                  <span>
                    {isEN
                      ? "Short description here…"
                      : "คำอธิบายสั้น ๆ ตรงนี้…"}
                  </span>
                </div>
                <div className="newsCard">
                  <b>{isEN ? "Highlight 3" : "ไฮไลต์ 3"}</b>
                  <span>
                    {isEN
                      ? "Short description here…"
                      : "คำอธิบายสั้น ๆ ตรงนี้…"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section> */}

      <section id="courses" className="section">
        {/* <h2 className="sectionTitle">{t.courseTitle}</h2> */}
        <h2 className="text-center text-white text-4xl font-semibold">
            {t.courseTitle}
          </h2>
        {/* <div className="sectionDesc">{t.courseDesc}</div> */}

        <div className="panel">
          <CourseGridClient locale={locale} limit={4} />
        </div>
      </section>
      {/* </main> */}

      {/* <Footer /> */}
    </>
  );
}
