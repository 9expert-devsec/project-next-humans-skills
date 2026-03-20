"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { gaEvent } from "@/lib/ga";
import { getCoursePublicState } from "@/lib/coursePublicState";
import CourseAlertModal from "@/components/ui/CourseAlertModal";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function periodLabel(p, isEN) {
  if (p === "morning") return isEN ? "Morning" : "ช่วงเช้า";
  if (p === "afternoon") return isEN ? "Afternoon" : "ช่วงบ่าย";
  if (p === "evening") return isEN ? "Evening" : "ช่วงเย็น";
  return isEN ? "Session" : "ช่วง";
}

const PARTNER_LABEL = {
  "Bitkub Academy": "Bitkub Academy",
  "9Expert Training": "9Expert Training",
  "Key Solutions Training": "Key Solutions Training",
};

function renderPartners(session) {
  const arr = Array.isArray(session?.partners)
    ? session.partners.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const fallback = session?.partner ? [String(session.partner).trim()] : [];
  const list = arr.length ? arr : fallback;

  if (!list.length) return "";
  return list.map((k) => PARTNER_LABEL[k] || k).join(" + ");
}

export default function CoursePublicDetailClient({ locale = "th", course }) {
  const isEN = locale === "en";
  const [alertOpen, setAlertOpen] = useState(false);

  const slug = String(course?.slug || "");
  const title =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "Untitled";

  useEffect(() => {
    if (!slug) return;

    gaEvent({
      action: "view_course",
      category: "course",
      label: slug,
      value: 1,
    });
  }, [slug]);

  useEffect(() => {
    window.scrollTo({top: 0, behavior: "auto"});
  },[]);

  const short = course?.short_description || course?.short || "";

  const detail =
    course?.detail_th ||
    course?.detail_en ||
    course?.detail ||
    course?.content?.rationale ||
    "";

  const coverUrl =
    course?.cover_image || course?.cover || course?.coverUrl || "";

  const publicRegisterHref = useMemo(() => {
    return `/${locale}/upcoming-register/${encodeURIComponent(slug)}/step-1`;
  }, [locale, slug]);

  const inhouseRegisterHref = useMemo(() => {
    return `/${locale}/register/${encodeURIComponent(slug)}/step-1`;
  }, [locale, slug]);

  const priceText = useMemo(() => {
    const amt = Number(course?.business?.price_amount || 0);
    const cur = course?.business?.price_currency || "THB";
    if (!amt) return isEN ? "Contact for pricing" : "สอบถามราคา";
    return `${amt.toLocaleString()} ${cur}`;
  }, [course, isEN]);

  const priceNote = useMemo(() => {
    return course?.priceNote || course?.business?.price_note || "";
  }, [course]);

  const curriculum = Array.isArray(course?.curriculum) ? course.curriculum : [];
  const hasCurriculum = curriculum.length > 0;

  const publicState = getCoursePublicState(course);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT */}
        <div className="lg:col-span-8">
          <div className="mb-4 text-sm text-white/60">
            <Link className="hover:text-white" href={`/${locale}`}>
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link className="hover:text-white" href={`/${locale}/courses`}>
              Courses
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{title}</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={title}
                className="h-[240px] w-full object-cover md:h-[320px]"
              />
            ) : (
              <div className="h-[240px] w-full bg-white/5 md:h-[320px]" />
            )}

            <div className="p-5 md:p-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {title}
              </h1>

              {short ? (
                <p className="mt-3 whitespace-pre-wrap text-white/70">
                  {short}
                </p>
              ) : null}

              {detail ? (
                <div className="mt-5 whitespace-pre-wrap leading-relaxed text-white/70">
                  {detail}
                </div>
              ) : null}
            </div>
          </div>

          {/* Curriculum */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur md:p-6">
            <div className="text-lg font-extrabold text-white">
              {isEN ? "Curriculum" : "กำหนดการอบรม"}
            </div>
            <div className="mt-1 text-sm text-white/60">
              {isEN
                ? "Session plan by day and period"
                : "แผนการอบรมแบ่งตามวันและช่วงเวลา"}
            </div>

            {!hasCurriculum ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/60">
                {isEN ? "No curriculum information." : "ยังไม่มีข้อมูลกำหนดการ"}
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {curriculum.map((day, di) => {
                  const sessions = Array.isArray(day?.sessions)
                    ? day.sessions
                    : [];

                  return (
                    <div
                      key={di}
                      className="rounded-2xl border border-white/10 bg-black/15 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-white">
                            {isEN
                              ? `Day ${day?.day || di + 1}`
                              : `วันที่ ${day?.day || di + 1}`}
                            {day?.title ? (
                              <span className="text-white/60">
                                {" "}
                                : {String(day.title)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {sessions.length === 0 ? (
                        <div className="mt-3 text-sm text-white/60">
                          {isEN ? "No sessions." : "ยังไม่มี session"}
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3">
                          {sessions.map((s, si) => {
                            const partnerText = renderPartners(s);
                            const topics = Array.isArray(s?.topics)
                              ? s.topics
                              : [];
                            const notes = String(s?.notes || "").trim();

                            return (
                              <div
                                key={si}
                                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-xs font-extrabold text-white/60">
                                    {periodLabel(s?.period, isEN)}
                                    {partnerText ? (
                                      <span className="text-white/50">
                                        {" "}
                                        • {partnerText}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {s?.title ? (
                                  <div className="mt-2 text-base font-extrabold text-white">
                                    {String(s.title)}
                                  </div>
                                ) : null}

                                {topics.length ? (
                                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">
                                    {topics.map((t, ti) => (
                                      <li key={ti}>{String(t)}</li>
                                    ))}
                                  </ul>
                                ) : null}

                                {notes ? (
                                  <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm text-white/70">
                                    <div className="text-xs font-extrabold text-white/60">
                                      {isEN ? "Notes" : "หมายเหตุ"}
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap">
                                      {notes}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-sm text-white/60">
                {isEN ? "Price" : "ราคา"}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {priceText}
              </div>

              {priceNote ? (
                <div className="mt-2 text-sm text-white/60">{priceNote}</div>
              ) : null}

              {course?.upcomingDateText ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/75">
                  <div className="text-xs font-extrabold text-white/55">
                    {isEN
                      ? "Upcoming public class"
                      : "รอบ Public ที่กำลังจะมาถึง"}
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {String(course.upcomingDateText)}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {publicState.isPublicOpen ? (
                  <Link
                    href={publicRegisterHref}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
                  >
                    {isEN ? "Register for Public Class" : "ลงทะเบียน Public"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAlertOpen(true)}
                    className={cx(
                      "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-extrabold",
                      "bg-[#E7C34A] text-slate-950 hover:brightness-105",
                    )}
                  >
                    {publicState.isPublicFull
                      ? isEN
                        ? "Notify me about the next round"
                        : "แจ้งเตือนรอบถัดไป"
                      : isEN
                        ? "Notify me when enrollment opens"
                        : "แจ้งเตือนเมื่อเปิดรับ"}
                  </button>
                )}

                <Link
                  href={inhouseRegisterHref}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10"
                >
                  {isEN ? "Request In-house Quotation" : "ขอใบเสนอราคา Inhouse"}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <CourseAlertModal
        open={alertOpen}
        onOpenChange={setAlertOpen}
        course={course}
        locale={locale}
        source="course_detail"
      />
    </>
  );
}
