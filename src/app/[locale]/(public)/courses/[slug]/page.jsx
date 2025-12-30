// src/app/[locale]/(public)/courses/[slug]/page.jsx
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import { ArrowLeft } from 'lucide-react';

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
  bitkub: "Bitkub",
  "9expert": "9Expert",
  key: "Key Solutions",
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

function getSessionPartnerKeys(s) {
  if (Array.isArray(s?.partners) && s.partners.length) {
    return s.partners.map((x) => String(x || "").trim()).filter(Boolean);
  }
  const one = String(s?.partner || "").trim();
  return one ? [one] : [];
}

function renderPartnersLine(keys) {
  if (!keys.length) return "";
  return keys.map((k) => PARTNER_LABEL[k] || k).join(" • ");
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

  // ✅ ดึงจาก DB ตรง (เทียบกับ API public)
  const course = await Course.findOne({
    slug: safeSlug,
    isActive: true,
    status: "published",
  }).lean();

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
  const titleEN = course.title_en || "";
  const cover = course.cover_image || "";

  return (
    <div className="mx-auto max-w-7xl ">
      {/* HERO / COVER */}
      <div className="mt-24 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur flex flex-col lg:flex-row-reverse">
        <div className="relative w-full lg:w-[60%]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={titleTH}
              className=" w-full object-cover "
            />
          ) : (
            <div className=" w-full bg-black/20" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />

          {/* <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <h1 className="text-2xl font-extrabold text-white md:text-3xl lg:text-4xl">
              {titleTH}
            </h1>
            {titleEN ? (
              <div className="mt-1 text-white/70">{titleEN}</div>
            ) : null}
          </div> */}
        </div>

        <div className="flex flex-col gap-6 p-6 w-full lg:w-[40%] md:items-start md:justify-between">
          <div className="flex flex-col gap-5">
            <Link
              href={`/${safeLocale}`}
              // className="rounded-xl bg-white/10 px-2 py-2 text-sm w-fit text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              <ArrowLeft />
              {/* Back */}
            </Link>
            <div>
              
              <h1 className="text-xl font-extrabold text-white md:text-2xl lg:text-3xl">
                {titleTH}
              </h1>
              {/* {titleEN ? (
                <div className="mt-1 text-white/70">{titleEN}</div>
              ) : null} */}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{course.level || "general"}</Badge>
              <Badge>{course.duration_days || 1} วัน</Badge>
              {/* {(course.partners || []).map((p) => (
                <Badge key={p}>{PARTNER_LABEL[p] || p}</Badge>
              ))} */}
            </div>

            {course.short_description ? (
              <p className="mt-4  whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {course.short_description}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2">
            <Link
              href={`/${safeLocale}/register/${course.slug}/step-1`}
              className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
            >
              ลงทะเบียน
            </Link>
            {/* <Link
              href={`/${safeLocale}`}
              className="rounded-xl bg-white/10 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              Back
            </Link> */}
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
                      <span className="mr-1 px-2 py-1 bg-white text-[#0B1C2C] rounded-full">วันที่ {d.day}</span> : {d.title}
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

                            {Array.isArray(s.topics) && s.topics.length ? (
                              <ul className="mt-3 grid gap-1 text-base text-[#0B1C2C]/75">
                                {s.topics.map((t, ti) => (
                                  <li key={ti} className="flex gap-2">
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0B1C2C]/75" />
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}

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
      </div>
    </div>
  );
}
