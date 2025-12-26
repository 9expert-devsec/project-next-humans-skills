// src/app/[locale]/(public)/register/[courseSlug]/step-1/RegisterStep1Client.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepBar from "@/components/StepBar";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

const YEARS = (() => {
  const y = new Date().getFullYear();
  return [y, y + 1, y + 2, y + 3];
})();

const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

function Field({ label, required, children, hint }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold text-white/85">
        {label} {required ? <span className="text-rose-300">*</span> : null}
      </div>
      {children}
      {hint ? <div className="mt-2 text-xs text-white/50">{hint}</div> : null}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  readOnly,
  inputMode,
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={cx(
        "h-11 w-full rounded-2xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none",
        "placeholder:text-white/35",
        "focus:border-white/20 focus:ring-2 focus:ring-white/10",
        disabled || readOnly ? "opacity-60" : ""
      )}
    />
  );
}

function Textarea({ value, onChange, placeholder, disabled }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      className={cx(
        "min-h-[96px] w-full resize-y rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white outline-none",
        "placeholder:text-white/35",
        "focus:border-white/20 focus:ring-2 focus:ring-white/10",
        disabled ? "opacity-60" : ""
      )}
    />
  );
}

function Select({ value, onChange, disabled, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cx(
        "h-11 w-full rounded-2xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none",
        "focus:border-white/20 focus:ring-2 focus:ring-white/10",
        disabled ? "opacity-60" : ""
      )}
    >
      {children}
    </select>
  );
}

/**
 * เบอร์โทร:
 * - มือถือ 06/08/09: 10 หลัก -> 0xx-xxx-xxxx
 * - เบอร์บ้าน 01/02/03/04/05/07: 9 หลัก -> 0x-xxx-xxxx และต่อได้ 5 หลัก (เก็บ digits รวม)
 */
function formatThaiPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const prefix = digits.substring(0, 2);

  let formatted = digits;
  let valid = false;

  if (["06", "08", "09"].includes(prefix)) {
    const d = digits.substring(0, 10);
    formatted =
      d.length >= 10 ? d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3") : d;
    valid = d.length === 10;
    return { digits: d, formatted, valid, type: "mobile" };
  }

  if (["01", "02", "03", "04", "05", "07"].includes(prefix)) {
    const main = digits.substring(0, 9);
    const ext = digits.length > 9 ? digits.substring(9, 14) : "";
    formatted =
      main.length >= 9
        ? main.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3")
        : main;
    if (ext) formatted += " ต่อ " + ext;
    valid = main.length === 9;
    return { digits: main + ext, formatted, valid, type: "landline" };
  }

  return { digits, formatted: digits, valid: false, type: "unknown" };
}

/** ✅ ใช้ draft key กลางสำหรับทุก step */
function DraftKey(courseSlug) {
  return `nx-register-draft:${String(courseSlug || "").trim()}`;
}

function isValidEmail(x) {
  const s = String(x || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getDefaultForm() {
  return {
    // meta
    courseSlug: "",
    locale: "th",

    // section 1
    trainee_count: 1,
    training_location: "",
    month_interest: "",
    year_interest: String(YEARS[0] || new Date().getFullYear()),

    // section 2
    first_name: "",
    last_name: "",
    position: "",
    department: "",
    contact_phone_raw: "",
    contact_phone: "",
    email: "",

    // section 3
    company: "",
    tax_id: "",
    company_phone_raw: "",
    company_phone: "",
    receipt_address: "",
    province: "",
    district: "",
    subdistrict: "",
    postcode: "",

    // section 4
    note: "",
  };
}

function sanitizeDraft(d = {}) {
  const base = getDefaultForm();

  const out = { ...base, ...(d && typeof d === "object" ? d : {}) };

  // numbers
  out.trainee_count = Math.max(1, Number(out.trainee_count || 1));

  // strings
  out.month_interest = String(out.month_interest || "");
  out.year_interest =
    String(out.year_interest || "") ||
    String(YEARS[0] || new Date().getFullYear());

  out.contact_phone_raw = String(out.contact_phone_raw || "").replace(
    /\D/g,
    ""
  );
  out.company_phone_raw = String(out.company_phone_raw || "").replace(
    /\D/g,
    ""
  );

  out.tax_id = String(out.tax_id || "")
    .replace(/\D/g, "")
    .slice(0, 13);

  return out;
}

export default function RegisterStep1Client({ locale = "th", courseSlug }) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);
  const [thDb, setThDb] = useState(null);

  // ✅ init form from session draft
  const [form, setForm] = useState(() => {
    if (typeof window === "undefined") return sanitizeDraft(getDefaultForm());
    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      const parsed = raw ? JSON.parse(raw) : {};
      return sanitizeDraft({
        ...parsed,
        courseSlug,
        locale,
      });
    } catch {
      return sanitizeDraft({ courseSlug, locale });
    }
  });

  // --- derived phone ---
  const contactPhone = useMemo(
    () => formatThaiPhone(form.contact_phone_raw),
    [form.contact_phone_raw]
  );
  const companyPhone = useMemo(
    () => formatThaiPhone(form.company_phone_raw),
    [form.company_phone_raw]
  );

  // sync digits-only to form.contact_phone/company_phone (สำหรับส่ง API)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      contact_phone: contactPhone.digits || "",
      company_phone: companyPhone.digits || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactPhone.digits, companyPhone.digits]);

  // ✅ load draft again when courseSlug changes (กรณีผู้ใช้เปลี่ยนคอร์ส/เปลี่ยน locale)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      if (!raw) {
        setForm((prev) =>
          sanitizeDraft({
            ...getDefaultForm(),
            ...prev,
            courseSlug,
            locale,
          })
        );
        return;
      }
      const parsed = JSON.parse(raw);
      setForm((prev) =>
        sanitizeDraft({
          ...prev,
          ...parsed,
          courseSlug,
          locale,
        })
      );
    } catch {
      setForm((prev) => sanitizeDraft({ ...prev, courseSlug, locale }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug, locale]);

  // ✅ persist draft (กลาง)
  useEffect(() => {
    try {
      const payloadToSave = {
        ...form,
        courseSlug,
        locale,
        _updatedAt: Date.now(),
      };
      sessionStorage.setItem(
        DraftKey(courseSlug),
        JSON.stringify(payloadToSave)
      );
    } catch {}
  }, [form, courseSlug, locale]);

  // fetch course by slug
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

  // load thailand postcode db
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/data/thailand_postcode.json", {
          cache: "force-cache",
        });
        const db = await res.json();
        if (!alive) return;
        setThDb(db && typeof db === "object" ? db : null);
      } catch {
        if (!alive) return;
        setThDb(null);
      }
    })();
    return () => (alive = false);
  }, []);

  // options
  const provinceOptions = useMemo(() => {
    if (!thDb) return [];
    return Object.keys(thDb).sort((a, b) => a.localeCompare(b, "th"));
  }, [thDb]);

  const districtOptions = useMemo(() => {
    if (!thDb || !form.province) return [];
    const p = thDb[form.province];
    if (!p) return [];
    return Object.keys(p).sort((a, b) => a.localeCompare(b, "th"));
  }, [thDb, form.province]);

  const subdistrictOptions = useMemo(() => {
    if (!thDb || !form.province || !form.district) return [];
    const d = thDb?.[form.province]?.[form.district];
    if (!d) return [];
    return Object.keys(d).sort((a, b) => a.localeCompare(b, "th"));
  }, [thDb, form.province, form.district]);

  const provinceDisabled = !thDb;
  const districtDisabled = !thDb || !form.province;
  const subdistrictDisabled = !thDb || !form.province || !form.district;

  // handlers
  const setField = (name) => (e) => {
    const v = e?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [name]: v }));
  };

  const setProvince = (e) => {
    const province = e.target.value;
    setForm((prev) => ({
      ...prev,
      province,
      district: "",
      subdistrict: "",
      postcode: "",
    }));
  };

  const setDistrict = (e) => {
    const district = e.target.value;
    setForm((prev) => ({
      ...prev,
      district,
      subdistrict: "",
      postcode: "",
    }));
  };

  const setSubdistrict = (e) => {
    const subdistrict = e.target.value;

    let postcode = "";
    if (thDb && form.province && form.district && subdistrict) {
      postcode = String(
        thDb?.[form.province]?.[form.district]?.[subdistrict] || ""
      );
    }

    setForm((prev) => ({
      ...prev,
      subdistrict,
      postcode,
    }));
  };

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "";

  function validateStep1() {
    const errs = [];

    if (!String(form.month_interest || "").trim())
      errs.push("เลือกเดือนที่สนใจ");
    if (!String(form.year_interest || "").trim()) errs.push("เลือกปีที่สนใจ");
    if (!String(form.training_location || "").trim())
      errs.push("ระบุสถานที่อบรม");

    if (!String(form.first_name || "").trim()) errs.push("กรอกชื่อ");
    if (!String(form.last_name || "").trim()) errs.push("กรอกนามสกุล");
    if (!String(form.contact_phone_raw || "").trim())
      errs.push("กรอกเบอร์โทรติดต่อ");
    if (form.contact_phone_raw && !contactPhone.valid)
      errs.push("รูปแบบเบอร์โทรไม่ถูกต้อง");
    if (!String(form.email || "").trim()) errs.push("กรอกอีเมล");
    if (form.email && !isValidEmail(form.email))
      errs.push("รูปแบบอีเมลไม่ถูกต้อง");

    if (!String(form.company || "").trim()) errs.push("กรอกบริษัท");
    if (!String(form.tax_id || "").trim())
      errs.push("กรอกเลขประจำตัวผู้เสียภาษี");
    if (String(form.tax_id || "").replace(/\D/g, "").length > 13)
      errs.push("เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 13 หลัก");
    if (!String(form.receipt_address || "").trim())
      errs.push("กรอกที่อยู่ออกใบเสร็จ");

    return errs;
  }

  async function onNext() {
    const errs = validateStep1();
    if (errs.length) {
      alert("กรุณากรอกข้อมูลให้ครบ:\n- " + errs.join("\n- "));
      return;
    }

    router.push(`/${locale}/register/${encodeURIComponent(courseSlug)}/step-2`);
  }

  function onBack() {
    router.push(`/${locale}/courses/${encodeURIComponent(courseSlug)}`);
  }

  function onResetDraft() {
    if (!confirm(isEN ? "Clear all form data?" : "ล้างข้อมูลที่กรอกทั้งหมด?"))
      return;
    try {
      sessionStorage.removeItem(DraftKey(courseSlug));
    } catch {}
    setForm(sanitizeDraft({ ...getDefaultForm(), courseSlug, locale }));
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-white">
        <div className="text-2xl font-extrabold">Course not found</div>
        <div className="mt-2 text-white/60">ไม่พบคอร์สสำหรับการลงทะเบียน</div>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        {/* header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white">
              {isEN ? "Register (Step 1)" : "ลงทะเบียน (ขั้นตอนที่ 1)"}
            </div>
            <div className="mt-2 text-sm text-white/60">
              {isEN
                ? "Fill in information for registration inquiry"
                : "กรอกข้อมูลเพื่อส่งความสนใจลงทะเบียน"}
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

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBack}
              className="h-11 rounded-2xl bg-white/10 px-5 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              Back
            </button>
            <button
              onClick={onResetDraft}
              className="h-11 rounded-2xl bg-rose-500/15 px-5 text-sm font-extrabold text-rose-100 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
            >
              {isEN ? "Clear" : "ล้างข้อมูล"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <StepBar current={1} locale={locale} />
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
            <div className="grid gap-5 md:grid-cols-12">
              <div className="md:col-span-4">
                <Field
                  label={isEN ? "Trainees count" : "จำนวนผู้เข้าอบรม"}
                  required
                >
                  <Input
                    type="number"
                    value={form.trainee_count}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        trainee_count: Math.max(1, Number(e.target.value || 1)),
                      }))
                    }
                    placeholder="1"
                  />
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field
                  label={isEN ? "Interested month" : "เดือนที่สนใจอบรม"}
                  required
                >
                  <Select
                    value={form.month_interest}
                    onChange={setField("month_interest")}
                  >
                    <option value="">{isEN ? "Select..." : "เลือก..."}</option>
                    {(isEN ? MONTHS_EN : MONTHS_TH).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field label={isEN ? "Interested year" : "ปีที่สนใจ"} required>
                  <Select
                    value={form.year_interest}
                    onChange={setField("year_interest")}
                  >
                    <option value="">{isEN ? "Select..." : "เลือก..."}</option>
                    {YEARS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="md:col-span-12">
                <Field
                  label={
                    isEN ? "Training location requirement" : "ระบุสถานที่อบรม"
                  }
                  required
                >
                  <Textarea
                    value={form.training_location}
                    onChange={setField("training_location")}
                    placeholder={
                      isEN
                        ? "Please specify the training location requirement..."
                        : "ระบุสถานที่อบรมที่ต้องการ เช่น On-site/Online/จังหวัด/เขต/รายละเอียดเพิ่มเติม..."
                    }
                  />
                </Field>
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
            <div className="grid gap-5 md:grid-cols-12">
              <div className="md:col-span-6">
                <Field label={isEN ? "First name" : "ชื่อ"} required>
                  <Input
                    value={form.first_name}
                    onChange={setField("first_name")}
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field label={isEN ? "Last name" : "นามสกุล"} required>
                  <Input
                    value={form.last_name}
                    onChange={setField("last_name")}
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field label={isEN ? "Position" : "ตำแหน่ง"}>
                  <Input
                    value={form.position}
                    onChange={setField("position")}
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field label={isEN ? "Department" : "แผนก"}>
                  <Input
                    value={form.department}
                    onChange={setField("department")}
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Contact phone" : "เบอร์โทรติดต่อ"}
                  required
                  hint="มือถือ: 0xx-xxx-xxxx | เบอร์บ้าน: 0x-xxx-xxxx ต่อ 12345"
                >
                  <Input
                    inputMode="tel"
                    value={contactPhone.formatted}
                    onChange={(e) => {
                      const digits = String(e.target.value || "").replace(
                        /\D/g,
                        ""
                      );
                      setForm((s) => ({ ...s, contact_phone_raw: digits }));
                    }}
                    placeholder="เช่น 089-123-4567 หรือ 02-123-4567 ต่อ 123"
                  />
                  {form.contact_phone_raw ? (
                    <div
                      className={cx(
                        "mt-2 text-xs",
                        contactPhone.valid
                          ? "text-emerald-300/80"
                          : "text-rose-300/80"
                      )}
                    >
                      {contactPhone.valid
                        ? "รูปแบบเบอร์ถูกต้อง"
                        : "รูปแบบเบอร์ยังไม่ถูกต้อง"}
                    </div>
                  ) : null}
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field label={isEN ? "Email" : "อีเมล"} required>
                  <Input
                    value={form.email}
                    onChange={setField("email")}
                    placeholder="name@company.com"
                  />
                </Field>
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
            <div className="grid gap-5 md:grid-cols-12">
              <div className="md:col-span-8">
                <Field label="บริษัท" required>
                  <Input
                    value={form.company}
                    onChange={setField("company")}
                    placeholder="ชื่อบริษัท"
                  />
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field
                  label="เลขประจำตัวผู้เสียภาษี"
                  required
                  hint="ตัวเลขเท่านั้น ไม่เกิน 13 หลัก"
                >
                  <Input
                    inputMode="numeric"
                    value={form.tax_id}
                    onChange={(e) => {
                      const digits = String(e.target.value || "")
                        .replace(/\D/g, "")
                        .slice(0, 13);
                      setForm((s) => ({ ...s, tax_id: digits }));
                    }}
                    placeholder="13 หลัก"
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label="เบอร์โทรบริษัท"
                  hint="ไม่บังคับ (รองรับรูปแบบเดียวกับเบอร์ติดต่อ)"
                >
                  <Input
                    inputMode="tel"
                    value={companyPhone.formatted}
                    onChange={(e) => {
                      const digits = String(e.target.value || "").replace(
                        /\D/g,
                        ""
                      );
                      setForm((s) => ({ ...s, company_phone_raw: digits }));
                    }}
                    placeholder="เช่น 02-123-4567 ต่อ 123"
                  />
                </Field>
              </div>

              <div className="md:col-span-12">
                <Field
                  label={
                    isEN
                      ? "Receipt address (detail)"
                      : "ที่อยู่สำหรับออกใบเสร็จ (รายละเอียด)"
                  }
                  required
                >
                  <Textarea
                    value={form.receipt_address}
                    onChange={setField("receipt_address")}
                    placeholder={
                      isEN
                        ? "Street / Building / etc."
                        : "บ้านเลขที่ ถนน อาคาร ฯลฯ"
                    }
                  />
                </Field>
              </div>

              {/* cascade selects */}
              <div className="md:col-span-3">
                <Field
                  label="จังหวัด"
                  hint="เลือกจังหวัดก่อน เพื่อปลดล็อคอำเภอ"
                >
                  <Select
                    value={form.province}
                    onChange={setProvince}
                    disabled={provinceDisabled}
                  >
                    <option value="">
                      {thDb ? "เลือก..." : "กำลังโหลดฐานข้อมูล..."}
                    </option>
                    {provinceOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field label="อำเภอ/เขต" hint="ปลดล็อคเมื่อเลือกจังหวัดแล้ว">
                  <Select
                    value={form.district}
                    onChange={setDistrict}
                    disabled={districtDisabled}
                  >
                    <option value="">
                      {districtDisabled ? "เลือกจังหวัดก่อน" : "เลือก..."}
                    </option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field label="ตำบล/แขวง" hint="ปลดล็อคเมื่อเลือกอำเภอแล้ว">
                  <Select
                    value={form.subdistrict}
                    onChange={setSubdistrict}
                    disabled={subdistrictDisabled}
                  >
                    <option value="">
                      {subdistrictDisabled ? "เลือกอำเภอก่อน" : "เลือก..."}
                    </option>
                    {subdistrictOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field label="รหัสไปรษณีย์" hint="Auto จากตำบล (แก้ไม่ได้)">
                  <Input
                    value={form.postcode}
                    onChange={() => {}}
                    readOnly
                    placeholder="Auto"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            no={4}
            title={isEN ? "Note" : "หมายเหตุ"}
            subtitle={isEN ? "Optional" : "ไม่บังคับ"}
          >
            <Field
              label={
                isEN
                  ? "Ask for more information"
                  : "Note / Ask for more information"
              }
            >
              <Textarea
                value={form.note}
                onChange={setField("note")}
                placeholder=""
              />
            </Field>
          </Section>

          {/* footer actions */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <button
              onClick={onNext}
              className="h-11 rounded-2xl bg-white px-6 text-sm font-extrabold text-slate-900 hover:bg-white/90"
            >
              {isEN ? "Next" : "ถัดไป"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
