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

function formatThaiPhone(rawDigits) {
  const digits = String(rawDigits || "").replace(/\D/g, "");
  if (!digits) return "";

  const prefix2 = digits.slice(0, 2);

  if (["06", "08", "09"].includes(prefix2)) {
    const d = digits.slice(0, 10);
    if (d.length < 10) return d;
    return d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  if (["01", "02", "03", "04", "05", "07"].includes(prefix2)) {
    const main = digits.slice(0, 9);
    const ext = digits.length > 9 ? digits.slice(9, 14) : "";
    let out = main;
    if (main.length >= 9) {
      out = main.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    if (ext) out += " ต่อ " + ext;
    return out;
  }

  return digits;
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

async function loadRecaptchaV3() {
  if (typeof window === "undefined") return;
  if (window.grecaptcha?.execute) return;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return;

  await new Promise((resolve, reject) => {
    const id = "recaptcha-v3";
    if (document.getElementById(id)) return resolve();

    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey,
    )}`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getRecaptchaToken(action) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return "";
  await loadRecaptchaV3();
  await new Promise((resolve) => window.grecaptcha.ready(resolve));
  return await window.grecaptcha.execute(siteKey, { action });
}

export default function UpcomingRegisterStep2Client({
  locale = "th",
  courseSlug,
}) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);
  const [draft, setDraft] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    return () => {
      alive = false;
    };
  }, [courseSlug]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      if (!raw) {
        router.replace(
          `/${locale}/upcoming-register/${encodeURIComponent(courseSlug)}/step-1`,
        );
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("bad draft");
      setDraft({ ...parsed, courseSlug, locale });
    } catch {
      router.replace(
        `/${locale}/upcoming-register/${encodeURIComponent(courseSlug)}/step-1`,
      );
    }
  }, [courseSlug, locale, router]);

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "";

  const trainees = useMemo(() => {
    const arr = Array.isArray(draft?.trainees) ? draft.trainees : [];
    return arr;
  }, [draft]);

  const traineesLine = useMemo(() => {
    if (!draft) return "-";
    if (draft.no_trainees_yet)
      return isEN ? "Not provided yet" : "ยังไม่ประสงค์แจ้งรายชื่อ";
    return `${draft.trainee_count || trainees.length || 1}`;
  }, [draft, trainees.length, isEN]);

  async function doConfirmSubmit() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      const draft = raw ? JSON.parse(raw) : null;
      if (!draft) throw new Error("Draft not found");

      const recaptchaToken = await getRecaptchaToken(
        "nx_upcoming_register_submit",
      );

      const res = await fetch("/api/public/upcoming-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          draft: { ...draft, courseSlug, locale },
          recaptchaToken,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Submit failed");
      }

      sessionStorage.setItem(
        ResultKey(courseSlug),
        JSON.stringify({ id: data.id, refNo: data.refNo }),
      );

      setConfirmOpen(false);
      router.push(
        `/${locale}/upcoming-register/${encodeURIComponent(courseSlug)}/step-3`,
      );
    } catch (e) {
      alert(e?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  if (!course || !draft) {
    return (
      <div className="mx-auto max-w-4xl mt-32 px-4 py-10 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
          <div className="text-2xl font-extrabold">
            {isEN ? "Loading..." : "กำลังโหลด..."}
          </div>
        </div>
      </div>
    );
  }

  const c = draft.coordinator || {};
  const tax = draft.tax || {};

  return (
    <div className="mx-auto max-w-7xl mt-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        <div className="mt-4 text-center">
          <div className="text-4xl font-extrabold text-white">
            {isEN ? "Register" : "ลงทะเบียน"}
          </div>
          <div className="mt-2 text-sm text-white/60">
            {isEN
              ? "Review information before confirmation"
              : "ตรวจสอบความถูกต้องของข้อมูลก่อนยืนยัน"}
          </div>
        </div>

        <div className="mt-6">
          <StepBar current={2} locale={locale} />
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
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
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          {/* coordinator */}
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
            <div className="text-lg font-extrabold text-white">
              {isEN ? "Coordinator" : "ข้อมูลผู้ประสานงาน"}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Name" : "ชื่อ-นามสกุล"}
                  value={`${clean(c.first_name)} ${clean(c.last_name)}`.trim()}
                />
              </div>

              <div className="md:col-span-6">
                <Item label="Email" value={c.email || "-"} />
              </div>

              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Phone" : "เบอร์โทร"}
                  value={formatThaiPhone(c.phone_raw || c.phone) || "-"}
                  mono
                />
              </div>

              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Trainee count" : "จำนวนผู้สมัคร"}
                  value={traineesLine}
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Trainee notice" : "สถานะรายชื่อผู้เข้าอบรม"}
                  value={
                    draft.no_trainees_yet
                      ? isEN
                        ? "Not provided yet"
                        : "ยังไม่ประสงค์แจ้งรายชื่อผู้เข้าอบรม"
                      : draft.coordinator_is_trainee
                        ? isEN
                          ? "Coordinator is trainee #1"
                          : "ผู้ประสานงานเป็นผู้เข้าอบรมท่านที่ 1"
                        : isEN
                          ? "Trainee names provided"
                          : "แจ้งรายชื่อผู้เข้าอบรมแล้ว"
                  }
                />
              </div>
            </div>
          </div>

          {/* trainees preview */}
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
            <div className="text-lg font-extrabold text-white">
              {isEN ? "Trainees" : "ผู้เข้าอบรม"}
            </div>

            <div className="mt-5">
              {draft.no_trainees_yet ? (
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm font-extrabold text-white">
                  {isEN
                    ? "Not provided yet"
                    : "ยังไม่ประสงค์แจ้งรายชื่อผู้เข้าอบรม"}
                </div>
              ) : trainees.length ? (
                <div className="grid gap-4">
                  {trainees.map((tr, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-black/15 p-5"
                    >
                      <div className="text-base font-extrabold text-white">
                        {isEN
                          ? `Trainee #${idx + 1}`
                          : `ผู้เข้าอบรมท่านที่ ${idx + 1}`}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <Item
                            label={isEN ? "Name" : "ชื่อ-นามสกุล"}
                            value={`${clean(tr.first_name)} ${clean(
                              tr.last_name,
                            )}`.trim()}
                          />
                        </div>

                        <div className="md:col-span-6">
                          <Item label="Email" value={clean(tr.email) || "-"} />
                        </div>

                        <div className="md:col-span-6">
                          <Item
                            label={isEN ? "Phone" : "เบอร์โทรศัพท์"}
                            value={
                              formatThaiPhone(tr.phone_raw || tr.phone) || "-"
                            }
                            mono
                          />
                        </div>

                        {draft.coordinator_is_trainee && idx === 0 ? (
                          <div className="md:col-span-6">
                            <Item
                              label={isEN ? "Note" : "หมายเหตุ"}
                              value={
                                isEN
                                  ? "Coordinator is trainee #1"
                                  : "ผู้ประสานงานเป็นผู้เข้าอบรมท่านที่ 1"
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm font-extrabold text-white/70">
                  {isEN ? "No trainee data" : "ไม่พบข้อมูลผู้เข้าอบรม"}
                </div>
              )}
            </div>
          </div>

          {/* tax */}
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
            <div className="text-lg font-extrabold text-white">
              {isEN ? "Tax Invoice / Receipt" : "ใบกำกับภาษี / ใบเสร็จรับเงิน"}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Type" : "ประเภท"}
                  value={
                    tax.type === "company"
                      ? isEN
                        ? "Company"
                        : "นิติบุคคล"
                      : isEN
                        ? "Personal"
                        : "บุคคลทั่วไป"
                  }
                />
              </div>

              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Tax ID" : "เลขผู้เสียภาษี"}
                  value={tax.tax_id || "-"}
                  mono
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Name / Company" : "ชื่อ/บริษัท"}
                  value={
                    tax.type === "company"
                      ? `${clean(tax.company_name) || "-"} (${clean(tax.branch) || "-"})`
                      : `${clean(tax.personal_first_name)} ${clean(
                          tax.personal_last_name,
                        )}`.trim() || "-"
                  }
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Address" : "ที่อยู่"}
                  value={tax.address || "-"}
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={
                    isEN
                      ? "Province / District / Subdistrict"
                      : "จังหวัด / อำเภอ / ตำบล"
                  }
                  value={
                    [
                      tax.province,
                      tax.district,
                      tax.subdistrict,
                      tax.postcode ? `(${tax.postcode})` : "",
                    ]
                      .map((x) => clean(x))
                      .filter(Boolean)
                      .join(" • ") || "-"
                  }
                />
              </div>
            </div>
          </div>

          {/* additional */}
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
            <div className="text-lg font-extrabold text-white">
              {isEN ? "Additional" : "ข้อมูลเพิ่มเติม"}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-12">
              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Source channel" : "ช่องทางรับข่าวสาร"}
                  value={
                    draft.source_channel === "Other"
                      ? `Other: ${draft.source_other || "-"}`
                      : draft.source_channel || "-"
                  }
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Note" : "หมายเหตุ"}
                  value={draft.note || "-"}
                />
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <button
              onClick={() =>
                router.push(
                  `/${locale}/upcoming-register/${encodeURIComponent(
                    courseSlug,
                  )}/step-1`,
                )
              }
              className="h-11 rounded-2xl bg-white/10 px-6 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              {isEN ? "Edit information" : "ย้อนกลับไปแก้ไข"}
            </button>

            <button
              onClick={() => setConfirmOpen(true)}
              className="h-11 rounded-2xl bg-white px-6 text-sm font-extrabold text-slate-900 hover:bg-white/90"
            >
              {isEN ? "Confirm" : "ยืนยันข้อมูล"}
            </button>
          </div>
        </div>
      </div>

      {/* confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-white shadow-2xl">
            <div className="text-xl font-extrabold">
              {isEN ? "Confirm submission" : "ยืนยันการส่งข้อมูล"}
            </div>

            <div className="mt-3 text-sm text-white/70">
              {isEN
                ? "We will send an email confirmation after submission."
                : "ระบบจะส่งอีเมลยืนยันหลังส่งข้อมูลสำเร็จ"}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="h-10 rounded-xl bg-white/10 px-4 text-sm font-bold text-white ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
              >
                {isEN ? "Cancel" : "ยกเลิก"}
              </button>

              <button
                onClick={doConfirmSubmit}
                disabled={submitting}
                className="h-10 rounded-xl bg-white px-5 text-sm font-extrabold text-slate-900 hover:bg-white/90 disabled:opacity-60"
              >
                {submitting
                  ? isEN
                    ? "Submitting..."
                    : "กำลังส่ง..."
                  : isEN
                    ? "Confirm"
                    : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
