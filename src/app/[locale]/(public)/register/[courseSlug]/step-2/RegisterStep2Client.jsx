"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepBar from "@/components/StepBar";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

/** ✅ ต้องใช้ key เดียวกับ Step 1 */
function DraftKey(courseSlug) {
  return `nx-register-draft:${String(courseSlug || "").trim()}`;
}

function Section({ no, title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
      <div className="text-lg font-extrabold text-white">
        {no}) {title}
      </div>
      {subtitle ? (
        <div className="mt-1 text-sm text-white/60">{subtitle}</div>
      ) : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Item({ label, value, mono }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
      <div className="text-xs font-bold text-white/55">{label}</div>
      <div
        className={cx(
          "mt-1 text-sm font-extrabold text-white break-words",
          mono ? "font-mono" : ""
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function formatThaiPhoneFromDigits(rawDigits) {
  const digits = String(rawDigits || "").replace(/\D/g, "");
  if (!digits) return "";

  const prefix2 = digits.slice(0, 2);

  // mobile 10 digits: 0xx-xxx-xxxx
  if (["06", "08", "09"].includes(prefix2)) {
    const d = digits.slice(0, 10);
    if (d.length < 10) return d;
    return d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  // landline 9 digits + ext
  if (["01", "02", "03", "04", "05", "07"].includes(prefix2)) {
    const main = digits.slice(0, 9);
    const ext = digits.length > 9 ? digits.slice(9, 14) : "";
    let out = main;
    if (main.length >= 9)
      out = main.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    if (ext) out += " ต่อ " + ext;
    return out;
  }

  return digits;
}

async function loadRecaptchaV3() {
  if (typeof window === "undefined") return;
  if (window.grecaptcha?.execute) return;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) throw new Error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");

  await new Promise((resolve, reject) => {
    const id = "recaptcha-v3";
    if (document.getElementById(id)) return resolve();

    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey
    )}`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getRecaptchaToken(action) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) throw new Error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");

  await loadRecaptchaV3();
  await new Promise((resolve) => window.grecaptcha.ready(resolve));

  return await window.grecaptcha.execute(siteKey, { action });
}

export default function RegisterStep2Client({ locale = "th", courseSlug }) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);
  const [draft, setDraft] = useState(null);

  // popup confirm + loading
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // guard: ถ้า slug หาย ให้กลับ home
  useEffect(() => {
    if (!courseSlug) router.replace(`/${locale}`);
  }, [courseSlug, locale, router]);

  // fetch course by slug (เพื่อ header)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/courses/${encodeURIComponent(courseSlug)}`,
          { cache: "no-store" }
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

  // ✅ load draft from sessionStorage (key กลาง)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      if (!raw) {
        router.replace(
          `/${locale}/register/${encodeURIComponent(courseSlug)}/step-1`
        );
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        router.replace(
          `/${locale}/register/${encodeURIComponent(courseSlug)}/step-1`
        );
        return;
      }

      // บังคับ meta ให้ตรง
      setDraft({
        ...parsed,
        courseSlug,
        locale,
      });
    } catch {
      router.replace(
        `/${locale}/register/${encodeURIComponent(courseSlug)}/step-1`
      );
    }
  }, [courseSlug, locale, router]);

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "";

  const locationLine = useMemo(() => {
    if (!draft) return "";
    const parts = [
      draft.training_location,
      draft.province,
      draft.district,
      draft.subdistrict,
      draft.postcode ? `(${draft.postcode})` : "",
    ]
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return parts.join(" • ");
  }, [draft]);

  function onBack() {
    // ✅ ไม่ใช้ router.back() ให้ push ไป step-1 ตรง ๆ
    router.push(`/${locale}/register/${encodeURIComponent(courseSlug)}/step-1`);
  }

  async function doConfirmSubmit() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const raw = sessionStorage.getItem(`nx-register-draft:${courseSlug}`);
      const draft = raw ? JSON.parse(raw) : null;
      if (!draft) throw new Error("Draft not found");

      const recaptchaToken = await getRecaptchaToken("nx_register_submit");

      const res = await fetch("/api/public/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: { ...draft, courseSlug, locale },
          recaptchaToken,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const msg =
          (Array.isArray(data?.errors) && data.errors.length
            ? data.errors.join(", ")
            : data?.error || "Submit failed") +
          (data?.reason ? ` (${data.reason})` : "");
        throw new Error(msg);
      }

      sessionStorage.setItem(
        `nx-register-result:${courseSlug}`,
        JSON.stringify({
          registrationId: data.registrationId,
          refNo: data.refNo, // ✅ เก็บ refNo ไว้โชว์ step-3
        })
      );

      setConfirmOpen(false);
      router.push(
        `/${locale}/register/${encodeURIComponent(courseSlug)}/step-3`
      );
    } catch (e) {
      alert(e?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  if (!course || !draft) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
          <div className="text-2xl font-extrabold">
            {isEN ? "Loading..." : "กำลังโหลดข้อมูล..."}
          </div>
          <div className="mt-2 text-white/60">
            {isEN ? "Preparing your preview" : "กำลังเตรียมหน้าตรวจสอบข้อมูล"}
          </div>
        </div>
      </div>
    );
  }

  const contactPhoneDigits =
    draft.contact_phone || draft.contact_phone_raw || "";
  const companyPhoneDigits =
    draft.company_phone || draft.company_phone_raw || "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        {/* header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white">
              {isEN ? "Register (Step 2)" : "ลงทะเบียน (ขั้นตอนที่ 2)"}
            </div>
            <div className="mt-2 text-sm text-white/60">
              {isEN
                ? "Review information before confirmation"
                : "ตรวจสอบความถูกต้องของข้อมูลก่อนยืนยัน"}
            </div>

            <div className="mt-4 flex items-center gap-3">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={courseTitle}
                  className="h-14 w-20 rounded-2xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="h-14 w-20 rounded-2xl bg-white/10 ring-1 ring-white/10" />
              )}

              <div className="min-w-0">
                <div className="text-sm font-bold text-white/70">
                  {isEN ? "Course:" : "คอร์ส:"}{" "}
                  <span className="text-white">{courseTitle}</span>
                </div>
                {course?.title_en && !isEN ? (
                  <div className="mt-1 text-sm text-white/50">
                    {course.title_en}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="h-11 rounded-2xl bg-white/10 px-5 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              Back
            </button>
          </div>
        </div>

        <div className="mt-6">
          <StepBar current={2} locale={locale} />
        </div>

        {/* body */}
        <div className="mt-8 grid gap-6">
          <Section
            no={1}
            title={isEN ? "Training request" : "ข้อมูลการอบรมที่ต้องการ"}
            subtitle={
              isEN
                ? "Training details and interest period"
                : "รายละเอียดการอบรมและช่วงเวลาที่สนใจ"
            }
          >
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Trainees count" : "จำนวนผู้เข้าอบรม"}
                  value={String(draft.trainee_count || "-")}
                />
              </div>
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Interested month" : "เดือนที่สนใจอบรม"}
                  value={draft.month_interest || "-"}
                />
              </div>
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Interested year" : "ปีที่สนใจ"}
                  value={draft.year_interest || "-"}
                />
              </div>
              <div className="md:col-span-12">
                <Item
                  label={
                    isEN ? "Training location requirement" : "ระบุสถานที่อบรม"
                  }
                  value={locationLine || "-"}
                />
              </div>
            </div>
          </Section>

          <Section
            no={2}
            title={
              isEN
                ? "Coordinator / Contact person"
                : "ข้อมูลผู้ประสานงาน / ผู้ติดต่อ"
            }
            subtitle={
              isEN ? "Contact details for follow-up" : "ข้อมูลสำหรับติดต่อกลับ"
            }
          >
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "First name" : "ชื่อ"}
                  value={draft.first_name || "-"}
                />
              </div>
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Last name" : "นามสกุล"}
                  value={draft.last_name || "-"}
                />
              </div>
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Position" : "ตำแหน่ง"}
                  value={draft.position || "-"}
                />
              </div>
              <div className="md:col-span-3">
                <Item
                  label={isEN ? "Department" : "แผนก"}
                  value={draft.department || "-"}
                />
              </div>

              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Contact phone" : "เบอร์โทรติดต่อ"}
                  value={formatThaiPhoneFromDigits(contactPhoneDigits) || "-"}
                  mono
                />
              </div>
              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Email" : "อีเมล"}
                  value={draft.email || "-"}
                />
              </div>
            </div>
          </Section>

          <Section
            no={3}
            title={
              isEN
                ? "Company / Receipt address"
                : "ข้อมูลบริษัท / ที่อยู่ออกใบเสร็จ"
            }
            subtitle={
              isEN
                ? "For quotation and receipt"
                : "ใช้สำหรับทำใบเสนอราคา/ใบเสร็จ"
            }
          >
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <Item
                  label={isEN ? "Company" : "บริษัท"}
                  value={draft.company || "-"}
                />
              </div>
              <div className="md:col-span-4">
                <Item
                  label={isEN ? "Tax ID" : "เลขประจำตัวผู้เสียภาษี"}
                  value={draft.tax_id || "-"}
                  mono
                />
              </div>

              <div className="md:col-span-6">
                <Item
                  label={isEN ? "Company phone" : "เบอร์โทรบริษัท"}
                  value={formatThaiPhoneFromDigits(companyPhoneDigits) || "-"}
                  mono
                />
              </div>

              <div className="md:col-span-12">
                <Item
                  label={isEN ? "Receipt address" : "ที่อยู่สำหรับออกใบเสร็จ"}
                  value={draft.receipt_address || "-"}
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
                      draft.province,
                      draft.district,
                      draft.subdistrict,
                      draft.postcode ? `(${draft.postcode})` : "",
                    ]
                      .map((x) => String(x || "").trim())
                      .filter(Boolean)
                      .join(" • ") || "-"
                  }
                />
              </div>
            </div>
          </Section>

          <Section
            no={4}
            title={isEN ? "Note" : "หมายเหตุ"}
            subtitle={isEN ? "Optional" : "ไม่บังคับ"}
          >
            <Item
              label={
                isEN
                  ? "Ask for more information"
                  : "Note / Ask for more information"
              }
              value={String(draft.note || "").trim() || "-"}
            />
          </Section>

          {/* footer actions */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <button
              onClick={onBack}
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

      {/* Confirm Popup */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-white shadow-2xl">
            <div className="text-xl font-extrabold">
              {isEN ? "Confirm submission" : "ยืนยันการส่งข้อมูล"}
            </div>

            <div className="mt-3 text-sm text-white/70">
              {isEN
                ? "Please confirm that the information is correct."
                : "กรุณายืนยันว่าข้อมูลทั้งหมดถูกต้องก่อนส่ง"}
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
                    : "กำลังส่งข้อมูล..."
                  : isEN
                  ? "Confirm"
                  : "ยืนยัน"}
              </button>
            </div>

            {submitting ? (
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-white/60" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
