// src/app/[locale]/(public)/courses/[slug]/page.jsx
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function Badge({ children }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white/80 ring-1 ring-white/10">
      {children}
    </span>
  );
}

const PARTNER_LABEL = {
  bitkub: "Bitkub Academy",
  "9expert": "9Expert Training",
  key: "Key Solutions Training",
  "Bitkub Academy": "Bitkub Academy",
  "9Expert Training": "9Expert Training",
  "Key Solutions Training": "Key Solutions Training",
};

function Bullet({ items }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!arr.length) return null;
  return (
    <ul className="mt-3 grid gap-2 text-base text-white/80">
      {arr.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-white/40" />
          <span className="leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function TopicGroups({ groups, legacyTopics }) {
  const g = Array.isArray(groups) ? groups : [];
  const legacy = Array.isArray(legacyTopics)
    ? legacyTopics.filter(Boolean)
    : [];

  if (g.length) {
    return (
      <div className="mt-3 grid gap-3">
        {g.map((x, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#0B1C2C]/10 bg-white p-3"
          >
            {x.title ? (
              <div className="text-base font-extrabold text-[#0B1C2C]">
                {x.title}
              </div>
            ) : null}

            {Array.isArray(x.items) && x.items.length ? (
              <ul className="mt-2 grid gap-1 text-base text-[#0B1C2C]/75">
                {x.items.map((t, ti) => (
                  <li key={ti} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0B1C2C]/65" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (legacy.length) {
    return (
      <ul className="mt-3 grid gap-1 text-base text-[#0B1C2C]/75">
        {legacy.map((t, ti) => (
          <li key={ti} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0B1C2C]/75" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    );
  }

  return null;
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="mt-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 ">{children}</div>
      <div className="mt-8 h-px w-full bg-white/10" />
    </section>
  );
}

function normalizePartnerKey(x) {
  return String(x || "").trim();
}

function labelPartner(x) {
  const k = normalizePartnerKey(x);
  return PARTNER_LABEL[k] || k;
}

function getSessionPartnerKeys(s) {
  if (Array.isArray(s?.partners) && s.partners.length) {
    return s.partners.map(normalizePartnerKey).filter(Boolean);
  }
  const one = normalizePartnerKey(s?.partner);
  return one ? [one] : [];
}

function renderPartnersLine(keys) {
  if (!keys.length) return "";
  return keys.map(labelPartner).join(" • ");
}

export async function generateMetadata({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const slug = decodeURIComponent(String(p?.slug || "")).trim();

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thenexthumansskills.com";

  if (!slug) {
    return {
      title: "Course not found | The Next Humans Skills",
      robots: { index: false, follow: false },
    };
  }

  await (await import("@/lib/dbConnect")).default();
  const Course = (await import("@/models/Course")).default;

  const course = await Course.findOne({
    slug,
    isActive: true,
    status: "published",
  }).lean();

  if (!course) {
    return {
      title: "Course not found | The Next Humans Skills",
      robots: { index: false, follow: false },
    };
  }

  const title =
    locale === "en"
      ? course.title_en || course.title_th
      : course.title_th || course.title_en;

  const description =
    course.short_description ||
    course.content?.rationale?.slice(0, 160) ||
    "หลักสูตรอบรมเพื่อพัฒนาทักษะบุคลากรยุคใหม่";

  const url = `${baseUrl}/${locale}/courses/${slug}`;
  const image = course.cover_image || `${baseUrl}/og/course-default.png`;

  return {
    title: `${title} | The Next Humans Skills`,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
      languages: {
        th: `${baseUrl}/th/courses/${slug}`,
        en: `${baseUrl}/en/courses/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "The Next Humans Skills",
      locale: locale === "en" ? "en_US" : "th_TH",
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const { locale, slug } = await params;
  const safeLocale = locale === "en" ? "en" : "th";
  const safeSlug = decodeURIComponent(String(slug || "")).trim();

  if (!safeSlug) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-2xl font-extrabold">Course not found</h1>
        <Link
          href={`/${safeLocale}`}
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  await dbConnect();

  const course = await Course.findOne({
    slug: safeSlug,
    isActive: true,
    status: "published",
  })
    .select({
      slug: 1,
      title_th: 1,
      title_en: 1,
      short_description: 1,
      cover_image: 1,
      duration_days: 1,
      partners: 1,
      content: 1,
      curriculum: 1,

      // ✅ upcoming
      isUpcoming: 1,
      upcomingTag: 1,
    })
    .lean();

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-2xl font-extrabold">Course not found</h1>
        <p className="mt-2 text-white/60">
          อาจยังไม่ published หรือปิดการใช้งาน
        </p>
        <Link
          href={`/${safeLocale}`}
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const titleTH = course.title_th || "Untitled";
  const cover = course.cover_image || "";
  const isEN = safeLocale === "en";

  const inhouseHref = `/${safeLocale}/register/${encodeURIComponent(
    course.slug || safeSlug,
  )}/step-1`;

  const upcomingRegisterHref = `/${safeLocale}/upcoming-register/${encodeURIComponent(
    course.slug || safeSlug,
  )}`;

  const showUpcomingRegister = !!course.isUpcoming;
  const upcomingIsFull = String(course.upcomingTag || "") === "full";
  const canUpcomingRegister = showUpcomingRegister && !upcomingIsFull;

  return (
    <div className="mx-auto max-w-7xl ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: titleTH,
            description:
              course.short_description || course.content?.rationale || "",
            provider: {
              "@type": "Organization",
              name: "The Next Humans Skills",
              url:
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://thenexthumansskills.com",
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "Onsite",
              instructor: (course.partners || []).map((p) => ({
                "@type": "Organization",
                name: labelPartner(p),
              })),
            },
          }),
        }}
      />

      {/* HERO / COVER */}
      <div className="mt-24 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur flex flex-col lg:flex-row-reverse">
        <div className="relative w-full lg:w-[60%]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={titleTH} className=" w-full object-cover " />
          ) : (
            <div className=" w-full bg-black/20" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
        </div>

        <div className="flex flex-col gap-6 p-6 w-full lg:w-[40%] md:items-start md:justify-between">
          <div className="flex flex-col gap-5">
            <Link href={`/${safeLocale}`}>
              <ArrowLeft />
            </Link>

            <div>
              <h1 className="text-xl font-extrabold text-white md:text-2xl lg:text-3xl">
                {titleTH}
              </h1>
            </div>

            {course.short_description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {course.short_description}
              </p>
            ) : null}
          </div>

          {/* ✅ CTA Buttons */}
          <div className="flex shrink-0 flex-wrap gap-2">
            {/* 2) Upcoming register */}
            {showUpcomingRegister ? (
              canUpcomingRegister ? (
                <Link
                  href={upcomingRegisterHref}
                  className="rounded-xl border bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
                >
                  {isEN ? "Register" : "ลงทะเบียน"}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={isEN ? "This class is full" : "คลาสเต็มแล้ว"}
                  className="
                    rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold
                    text-white/45 cursor-not-allowed
                  "
                >
                  {isEN ? "Full" : "เต็มแล้ว"}
                </button>
              )
            ) : null}

            {/* 1) Inhouse */}
            <Link
              href={inhouseHref}
              className="rounded-xl  border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/15"
            >
              {isEN ? "Request Quotation (Inhouse)" : "ขอใบเสนอราคา Inhouse"}
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <Section title="หลักการและเหตุผล">
          {course.content?.rationale ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
              {course.content.rationale}
            </p>
          ) : null}
        </Section>

        <Section title="วัตถุประสงค์">
          <Bullet items={course.content?.objectives} />
        </Section>

        <Section title="กลุ่มเป้าหมาย">
          <Bullet items={course.content?.target_audience} />
        </Section>

        <Section title="ประโยชน์ที่จะได้รับ">
          <Bullet items={course.content?.benefits} />
        </Section>

        {Array.isArray(course.curriculum) && course.curriculum.length ? (
          <Section title="โครงสร้างหลักสูตร">
            <div className="mt-4 grid gap-4">
              {course.curriculum
                .slice()
                .sort((a, b) => (a.day || 0) - (b.day || 0))
                .map((d, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border-2 border-white/50 bg-black/20 p-4"
                  >
                    <div className="text-lg font-extrabold text-white">
                      <span className="mr-1 px-2 py-1 bg-white text-[#0B1C2C] rounded-full">
                        วันที่ {d.day}
                      </span>{" "}
                      : {d.title}
                    </div>

                    <div className="mt-3 grid gap-3">
                      {(d.sessions || []).map((s, si) => {
                        const pkeys = getSessionPartnerKeys(s);
                        const partnerText = renderPartnersLine(pkeys);

                        return (
                          <div
                            key={si}
                            className="rounded-2xl border border-white/10 bg-white/90 p-4"
                          >
                            <div className="text-sm font-extrabold text-[#0B1C2C]/70">
                              {(s.period || "").toUpperCase()}
                              {partnerText ? ` • ${partnerText}` : ""}
                            </div>

                            <div className="mt-2 text-lg font-bold text-[#0B1C2C]">
                              {s.title}
                            </div>

                            <TopicGroups
                              groups={s.topic_groups}
                              legacyTopics={s.topics}
                            />

                            {s.notes ? (
                              <div className="mt-3 whitespace-pre-wrap text-xs text-white/55">
                                {s.notes}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        ) : null}

        {/* ✅ CTA Bottom */}
        <section className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {showUpcomingRegister ? (
            canUpcomingRegister ? (
              <Link
                href={upcomingRegisterHref}
                className="inline-flex items-center justify-center rounded-xl bg-white px-10 py-4 text-lg font-extrabold text-slate-900 hover:bg-white/90 "
              >
                {isEN ? "Register" : "ลงทะเบียน"}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={isEN ? "This class is full" : "คลาสเต็มแล้ว"}
                className="
                  inline-flex items-center justify-center rounded-xl
                  border border-white/10 bg-white/5 px-10 py-4
                  text-lg font-extrabold text-white/45 cursor-not-allowed
                "
              >
                {isEN ? "Full" : "เต็มแล้ว"}
              </button>
            )
          ) : null}

          <Link
            href={inhouseHref}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-10 py-4 text-lg font-extrabold text-white hover:bg-white/15"
          >
            {isEN ? "Request Quotation (Inhouse)" : "ขอใบเสนอราคา Inhouse"}
          </Link>
        </section>
      </div>
    </div>
  );
}
