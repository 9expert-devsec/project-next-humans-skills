// src/app/[locale]/(public)/upcoming-register/[courseSlug]/step-3/UpcomingRegisterStep3Client.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepBar from "@/components/StepBar";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function DraftKey(courseSlug) {
  return `nx-upcoming-register-draft:${String(courseSlug || "").trim()}`;
}
function ResultKey(courseSlug) {
  return `nx-upcoming-register-result:${String(courseSlug || "").trim()}`;
}

function clean(x) {
  return String(x ?? "").trim();
}

function Item({ label, value, mono }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
      <div className="text-xs font-bold text-white/55">{label}</div>
      <div
        className={cx(
          "mt-1 text-sm font-extrabold text-white break-words",
          mono ? "font-mono" : "",
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function formatSource(locale, channel, otherText) {
  const c = clean(channel);
  if (!c) return "-";
  if (c !== "Other") return c;
  const t = clean(otherText);
  return t ? `Other: ${t}` : "Other";
}

function pickCourseDateText(course, locale = "th") {
  const direct =
    clean(course?.upcomingDateText) ||
    clean(course?.upcoming_date_text) ||
    clean(course?.upcomingDateLabel) ||
    clean(course?.upcoming_date_label) ||
    clean(course?.courseDateText) ||
    clean(course?.course_date_text);

  if (direct) return direct;

  const startRaw =
    course?.upcomingStartDate ||
    course?.upcoming_start_date ||
    course?.startDate ||
    course?.start_date;

  const endRaw =
    course?.upcomingEndDate ||
    course?.upcoming_end_date ||
    course?.endDate ||
    course?.end_date;

  const start = startRaw ? new Date(startRaw) : null;
  const end = endRaw ? new Date(endRaw) : null;

  if (start && !Number.isNaN(start.getTime())) {
    const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (end && !Number.isNaN(end.getTime())) {
      return `${fmt.format(start)} - ${fmt.format(end)}`;
    }

    return fmt.format(start);
  }

  return "-";
}

export default function UpcomingRegisterStep3Client({
  locale = "th",
  courseSlug,
}) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);
  const [draft, setDraft] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!courseSlug) router.replace(`/${locale}`);
  }, [courseSlug, locale, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/courses/${encodeURIComponent(courseSlug)}`,
          { cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        setCourse(data?.ok ? data.item : null);
      } catch {
        if (!alive) return;
        setCourse(null);
      }
    })();
    return () => (alive = false);
  }, [courseSlug]);

  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem(DraftKey(courseSlug));
      const rawResult = sessionStorage.getItem(ResultKey(courseSlug));

      setDraft(rawDraft ? JSON.parse(rawDraft) : null);
      setResult(rawResult ? JSON.parse(rawResult) : null);
    } catch {
      setDraft(null);
      setResult(null);
    }
  }, [courseSlug]);

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "Course";

  const courseDateText = useMemo(
    () => pickCourseDateText(course, locale),
    [course, locale],
  );

  const refNo = clean(result?.refNo) || "(ยังไม่มีเลขอ้างอิง)";
  const coordinator = draft?.coordinator || {};

  const contactName = useMemo(() => {
    return (
      [clean(coordinator.first_name), clean(coordinator.last_name)]
        .filter(Boolean)
        .join(" ") || "-"
    );
  }, [coordinator]);

  function goCourse() {
    router.push(`/${locale}/courses/${encodeURIComponent(courseSlug)}`);
  }

  function startNew() {
    try {
      sessionStorage.removeItem(DraftKey(courseSlug));
      sessionStorage.removeItem(ResultKey(courseSlug));
    } catch {}
    router.push(
      `/${locale}/upcoming-register/${encodeURIComponent(courseSlug)}/step-1`,
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl mt-24">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
          <div className="text-2xl font-extrabold text-white">
            {isEN ? "Loading..." : "กำลังโหลด..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl mt-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        <div className="mt-7">
          <div className="text-4xl font-extrabold text-white text-center">
            {isEN ? "Register Completed" : "ลงทะเบียนเสร็จสิ้น"}
          </div>
          <div className="mt-2 text-sm text-white/60 text-center">
            {isEN
              ? "Your registration has been submitted successfully. A confirmation email has been sent."
              : "ส่งข้อมูลเรียบร้อยแล้ว และได้ส่งอีเมลยืนยันให้ท่าน"}
          </div>
        </div>

        <div className="mt-6">
          <StepBar current={3} completed locale={locale} />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mt-4 flex items-center gap-5 flex-col md:flex-row">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={courseTitle}
                  className="w-full md:w-60 rounded-2xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="w-full md:w-60 rounded-2xl bg-white/10 ring-1 ring-white/10" />
              )}

              <div className="min-w-0">
                <div className="text-lg font-bold text-white/70">
                  {isEN ? "Course:" : "หลักสูตร"}{" "}
                  <div className="text-white">{courseTitle}</div>
                </div>
                <div className="mt-2 text-sm text-white/60">
                  {isEN ? "Training date:" : "วันอบรม:"}{" "}
                  <span className="text-white">{courseDateText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          {/* success */}
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <div className="text-2xl font-extrabold text-white">
                  {isEN ? "Success 🎉" : "สำเร็จ 🎉"}
                </div>
                <div className="mt-2 text-sm text-white/60">
                  {isEN
                    ? "We have received your registration information."
                    : "เราได้รับข้อมูลความสนใจลงทะเบียนเรียบร้อยแล้ว"}
                </div>

                <div className="mt-5 grid gap-3">
                  <Item
                    label={isEN ? "Reference No." : "เลขอ้างอิง"}
                    value={refNo}
                    mono
                  />
                  <Item
                    label={isEN ? "Contact name" : "ผู้ติดต่อ"}
                    value={contactName}
                  />
                  <Item
                    label={isEN ? "Email" : "อีเมล"}
                    value={clean(coordinator.email) || "-"}
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="h-full rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="text-sm font-extrabold text-emerald-200">
                    {isEN ? "What’s next?" : "ขั้นตอนถัดไป"}
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-white/75">
                    <li>
                      •{" "}
                      {isEN
                        ? "Our team will contact you to confirm the details."
                        : "ทีมงานจะติดต่อกลับเพื่อยืนยันรายละเอียด"}
                    </li>
                    <li>
                      •{" "}
                      {isEN
                        ? "Please keep your reference number for follow-up."
                        : "กรุณาเก็บเลขอ้างอิงไว้ใช้ในการสอบถามข้อมูล"}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* summary */}
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
            <div className="text-lg font-extrabold text-white">
              {isEN ? "Summary" : "สรุปข้อมูลที่ส่ง"}
            </div>
            <div className="mt-1 text-sm text-white/60">
              {isEN
                ? "Keep this for your record."
                : "เก็บไว้เป็นหลักฐานการส่งข้อมูล"}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Trainees" : "จำนวนผู้เข้าอบรม"}
                  value={String(draft?.trainee_count || "-")}
                />
              </div>

              <div className="md:col-span-5">
                <Item
                  label={isEN ? "Training date" : "วันอบรม"}
                  value={courseDateText}
                />
              </div>

              <div className="md:col-span-4">
                <Item
                  label={isEN ? "Phone" : "เบอร์โทร"}
                  value={
                    clean(coordinator.phone_raw || coordinator.phone) || "-"
                  }
                  mono
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Tax type" : "ประเภทเอกสารภาษี"}
                  value={
                    draft?.tax?.type === "company"
                      ? isEN
                        ? "Company"
                        : "นิติบุคคล / บริษัท"
                      : isEN
                        ? "Personal"
                        : "บุคคลทั่วไป"
                  }
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Source channel" : "ช่องทางรับข่าวสาร"}
                  value={formatSource(
                    locale,
                    draft?.source_channel,
                    draft?.source_other,
                  )}
                />
              </div>

              {clean(draft?.note) ? (
                <div className="md:col-span-12">
                  <Item
                    label={isEN ? "Note" : "หมายเหตุ"}
                    value={clean(draft?.note)}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <button
              onClick={goCourse}
              className="h-11 rounded-2xl bg-white/10 px-6 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              {isEN ? "Back to course" : "กลับหน้าคอร์ส"}
            </button>

            <button
              onClick={startNew}
              className="h-11 rounded-2xl bg-white px-6 text-sm font-extrabold text-slate-900 hover:bg-white/90"
            >
              {isEN ? "Start new registration" : "เริ่มลงทะเบียนใหม่"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
