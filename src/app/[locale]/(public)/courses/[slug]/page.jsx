// src/app/[locale]/(public)/courses/[slug]/page.jsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import CourseDetailActions from "@/components/ui/CourseDetailActions";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

// Infer OG image mime type from a file extension. Returns undefined when the
// extension is unknown so we never declare a wrong `type`.
function ogTypeFromUrl(url) {
  const clean = String(url || "").split("?")[0].toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  return undefined;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      <div className="mt-3">{children}</div>
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

  const baseUrl = SITE_URL;

  if (!slug) {
    return {
      title: "Course not found | The Next Humans Skills",
      robots: { index: false, follow: false },
    };
  }

  await dbConnect();

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

  // A course cover image can be any size, so we must NOT fabricate width/height
  // for it (that would emit a mismatched dimension declaration). We only declare
  // `type` when it can be inferred from the extension. Courses with no cover fall
  // back to the shared DEFAULT_OG_IMAGE, whose dimensions are known-correct.
  let ogImages;
  let twitterImage;
  if (course.cover_image) {
    const coverType = ogTypeFromUrl(course.cover_image);
    ogImages = [
      {
        url: course.cover_image,
        ...(coverType ? { type: coverType } : {}),
        alt: title,
      },
    ];
    twitterImage = course.cover_image;
  } else {
    ogImages = [{ ...DEFAULT_OG_IMAGE, alt: title }];
    twitterImage = DEFAULT_OG_IMAGE.url;
  }

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
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage],
    },
  };
}

export default async function Page({ params }) {
  const { locale, slug } = await params;
  const safeLocale = locale === "en" ? "en" : "th";
  const safeSlug = decodeURIComponent(String(slug || "")).trim();
  const isEN = safeLocale === "en";

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
      isUpcoming: 1,
      upcomingTag: 1,
      upcomingDateText: 1,
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

  const title = isEN
    ? course.title_en || course.title_th || "Untitled"
    : course.title_th || course.title_en || "Untitled";

  const cover = course.cover_image || "";

  const courseForActions = {
    slug: String(course.slug || safeSlug),
    title_th: String(course.title_th || ""),
    title_en: String(course.title_en || ""),
    isUpcoming: !!course.isUpcoming,
    upcomingTag: String(course.upcomingTag || ""),
    upcomingDateText: String(course.upcomingDateText || ""),
  };

  return (
    <div className="mx-auto max-w-7xl">
      <ScrollToTopOnMount />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: title,
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
      <div className="mt-24 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur lg:flex-row-reverse">
        <div className="relative w-full lg:w-[60%]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={title} className="w-full object-cover" />
          ) : (
            <div className="w-full bg-black/20" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
        </div>

        <div className="flex w-full flex-col gap-6 p-6 md:items-start md:justify-between lg:w-[40%]">
          <div className="flex flex-col gap-5">
            <Link href={`/${safeLocale}`}>
              <ArrowLeft />
            </Link>

            <div>
              <h1 className="text-xl font-extrabold text-white md:text-2xl lg:text-3xl">
                {title}
              </h1>
            </div>

            {course.short_description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {course.short_description}
              </p>
            ) : null}
          </div>

          <CourseDetailActions
            locale={safeLocale}
            course={courseForActions}
            size="compact"
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <Section title={isEN ? "Rationale" : "หลักการและเหตุผล"}>
          {course.content?.rationale ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
              {course.content.rationale}
            </p>
          ) : null}
        </Section>

        <Section title={isEN ? "Objectives" : "วัตถุประสงค์"}>
          <Bullet items={course.content?.objectives} />
        </Section>

        <Section title={isEN ? "Target Audience" : "กลุ่มเป้าหมาย"}>
          <Bullet items={course.content?.target_audience} />
        </Section>

        <Section title={isEN ? "Benefits" : "ประโยชน์ที่จะได้รับ"}>
          <Bullet items={course.content?.benefits} />
        </Section>

        {Array.isArray(course.curriculum) && course.curriculum.length ? (
          <Section title={isEN ? "Curriculum Structure" : "โครงสร้างหลักสูตร"}>
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
                      <span className="mr-1 rounded-full bg-white px-2 py-1 text-[#0B1C2C]">
                        {isEN ? `Day ${d.day}` : `วันที่ ${d.day}`}
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
                              <div className="mt-3 whitespace-pre-wrap text-xs text-[#0B1C2C]/55">
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

        <section className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CourseDetailActions
            locale={safeLocale}
            course={courseForActions}
            size="large"
            className="justify-center"
          />
        </section>
      </div>
    </div>
  );
}
