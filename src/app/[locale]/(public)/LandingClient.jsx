"use client";

import { useEffect, useMemo, useState } from "react";
import CourseCard from "@/components/ui/CourseCard";

export default function LandingClient({ locale = "th" }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = useMemo(
    () => ({
      heroTitle: "NEXT SKILLS",
      heroDesc:
        locale === "en"
          ? "Modern training registration system with admin dashboard."
          : "ระบบลงทะเบียนอบรม + หลังบ้านจัดการ (โทนทันสมัย)",
      sectionCourses: locale === "en" ? "Recommended Courses" : "คอร์สแนะนำ",
      sectionNews: locale === "en" ? "News / Media" : "ข่าวสาร / สื่อ",
      loading: locale === "en" ? "Loading…" : "กำลังโหลด…",
      empty: locale === "en" ? "No courses yet" : "ยังไม่มีคอร์ส",
    }),
    [locale]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/public/courses?limit=4", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!alive) return;
        setCourses(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (!alive) return;
        setCourses([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.heroTitle}>{t.heroTitle}</div>
              <div style={styles.heroDesc}>{t.heroDesc}</div>
            </div>

            <div style={styles.badges}>
              <Badge
                label="Blockchain • Data"
                bg="rgba(0,179,89,.18)"
                bd="rgba(0,179,89,.35)"
              />
              <Badge
                label="AI • Automation"
                bg="rgba(59,130,246,.18)"
                bd="rgba(59,130,246,.35)"
              />
              <Badge
                label="Human • Growth"
                bg="rgba(246,214,45,.12)"
                bd="rgba(246,214,45,.35)"
              />
            </div>
          </div>

          <div style={styles.heroBottom}>
            <div style={styles.stat}>
              <div style={styles.statLabel}>
                {locale === "en" ? "Platform" : "แพลตฟอร์ม"}
              </div>
              <div style={styles.statValue}>Next.js + MongoDB</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>
                {locale === "en" ? "Email" : "อีเมล"}
              </div>
              <div style={styles.statValue}>Postmark</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>
                {locale === "en" ? "Images" : "รูปภาพ"}
              </div>
              <div style={styles.statValue}>Cloudinary</div>
            </div>
          </div>
        </section>

        {/* NEWS */}
        <section style={{ marginTop: 14 }}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionTitle}>{t.sectionNews}</div>
              <div style={styles.sectionDesc}>
                {locale === "en"
                  ? "Placeholder for image slider / videos."
                  : "พื้นที่สำหรับสไลด์รูปภาพ/วิดีโอ (เพิ่มทีหลังได้)"}
              </div>
            </div>
          </div>

          <div style={styles.newsBox}>
            <div style={styles.newsHint}>
              {locale === "en"
                ? "Add a slider here (News collection) later."
                : "เพิ่มสไลด์ข่าวจาก News collection ได้ในขั้นถัดไป"}
            </div>
          </div>
        </section>

        {/* COURSES */}
        <section style={{ marginTop: 14 }}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionTitle}>{t.sectionCourses}</div>
              <div style={styles.sectionDesc}>
                {locale === "en"
                  ? "Latest active courses"
                  : "คอร์สที่เปิดใช้งานล่าสุด"}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ marginTop: 10, opacity: 0.8 }}>{t.loading}</div>
          ) : courses.length === 0 ? (
            <div style={{ marginTop: 10, opacity: 0.8 }}>{t.empty}</div>
          ) : (
            <div style={styles.grid}>
              {courses.map((c) => (
                <CourseCard key={String(c._id)} locale={locale} course={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Badge({ label, bg, bd }) {
  return (
    <span style={{ ...styles.badge, background: bg, borderColor: bd }}>
      <span style={styles.dot} />
      {label}
    </span>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 80px)",
    padding: 16,
  },
  container: {
    maxWidth: 1120,
    margin: "0 auto",
  },

  hero: {
    border: "1px solid rgba(255,255,255,.12)",
    background:
      "linear-gradient(135deg, rgba(26,31,36,.55), rgba(11,28,45,.35))",
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
  },
  heroTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: 1000,
    letterSpacing: 0.4,
    lineHeight: 1.05,
  },
  heroDesc: {
    marginTop: 10,
    opacity: 0.82,
    maxWidth: 720,
    fontSize: 14,
  },

  badges: { display: "flex", gap: 10, flexWrap: "wrap" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    fontWeight: 1000,
    fontSize: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    background: "rgba(255,255,255,.75)",
  },

  heroBottom: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  stat: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(26,31,36,.35)",
    borderRadius: 16,
    padding: 12,
  },
  statLabel: { opacity: 0.7, fontSize: 12 },
  statValue: { marginTop: 6, fontWeight: 1000 },

  sectionHead: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: { fontWeight: 1000, fontSize: 18 },
  sectionDesc: { opacity: 0.75, fontSize: 12, marginTop: 6 },

  newsBox: {
    marginTop: 10,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(26,31,36,.35)",
    borderRadius: 18,
    padding: 18,
    minHeight: 140,
    display: "grid",
    placeItems: "center",
  },
  newsHint: { opacity: 0.75, fontSize: 13, textAlign: "center" },

  grid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
};
