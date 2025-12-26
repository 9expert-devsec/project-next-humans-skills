import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseGridClient from "@/components/ui/CourseGridClient";
import HeroIllustration from "@/components/public/HeroIllustration";

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
    courseTitle: isEN ? "Recommended Courses" : "คอร์สแนะนำ",
    courseDesc: isEN ? "Latest courses available" : "คอร์สที่เปิดใช้งานล่าสุด",
  };

  return (
    <>
      {/* <Header locale={locale} /> */}

      <main className="container">
        <section className="hero">
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
        </section>

        <section className="section">
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
        </section>

        <section id="courses" className="section">
          <h2 className="sectionTitle">{t.courseTitle}</h2>
          <div className="sectionDesc">{t.courseDesc}</div>

          <div className="panel">
            <CourseGridClient locale={locale} limit={4} />
          </div>
        </section>
      </main>

      {/* <Footer /> */}
    </>
  );
}
