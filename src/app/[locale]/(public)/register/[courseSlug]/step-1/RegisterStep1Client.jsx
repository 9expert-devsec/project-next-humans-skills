// src/app/[locale]/(public)/register/[courseSlug]/step-1/RegisterStep1Client.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepBar from "@/components/StepBar";
import { ArrowLeft } from "lucide-react";

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

function Field({ label, required, children, hint, error }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold text-white/85">
        {label} {required ? <span className="text-rose-300">*</span> : null}
      </div>

      {children}

      {error ? (
        <div className="mt-2 text-xs font-semibold text-rose-300">{error}</div>
      ) : hint ? (
        <div className="mt-2 text-xs text-white/50">{hint}</div>
      ) : null}
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
  error,
  onBlur,
  dataField,
}) {
  return (
    <input
      data-field={dataField}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={cx(
        "h-11 w-full rounded-2xl border bg-black/15 px-4 text-sm text-white outline-none",
        "placeholder:text-white/35",
        "focus:ring-2",
        error
          ? "border-rose-400/50 focus:border-rose-300/70 focus:ring-rose-400/15"
          : "border-white/10 focus:border-white/20 focus:ring-white/10",
        disabled || readOnly ? "opacity-60" : ""
      )}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  disabled,
  error,
  onBlur,
  dataField,
}) {
  return (
    <textarea
      data-field={dataField}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      className={cx(
        "min-h-[96px] w-full resize-y rounded-2xl border bg-black/15 px-4 py-3 text-sm text-white outline-none",
        "placeholder:text-white/35",
        "focus:ring-2",
        error
          ? "border-rose-400/50 focus:border-rose-300/70 focus:ring-rose-400/15"
          : "border-white/10 focus:border-white/20 focus:ring-white/10",
        disabled ? "opacity-60" : ""
      )}
    />
  );
}

function Select({
  value,
  onChange,
  disabled,
  children,
  error,
  onBlur,
  dataField,
}) {
  return (
    <select
      data-field={dataField}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      className={cx(
        "h-11 w-full rounded-2xl border bg-black/15 px-4 text-sm text-white outline-none themed-select ",
        "focus:ring-2 ",
        error
          ? "border-rose-400/50 focus:border-rose-300/70 focus:ring-rose-400/15"
          : "border-white/10 focus:border-white/20 focus:ring-white/10",
        disabled ? "opacity-60" : ""
      )}
    >
      {children}
    </select>
  );
}

function InfoTip({ text }) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[12px] font-extrabold text-white/70"
        aria-label="info"
      >
        i
      </span>

      <span
        className={cx(
          "pointer-events-none absolute left-full top-1/2 z-20 ml-2 w-[min(18rem,calc(100vw-2rem))] -translate-y-1/2",
          "rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs text-white/85 shadow-xl",
          "opacity-0 translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0"
        )}
      >
        {text}
      </span>
    </span>
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

function defaultBranchByLocale(locale) {
  return locale === "en" ? "Head Office" : "สำนักงานใหญ่";
}

function getDefaultForm(locale = "th") {
  return {
    // meta
    courseSlug: "",
    locale,

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
    branch: defaultBranchByLocale(locale), // ✅ required + editable
    tax_id: "",
    company_phone_raw: "",
    company_phone: "",
    receipt_address: "",
    province: "",
    district: "",
    subdistrict: "",
    postcode: "",

    // section 4
    source_channel: "",
    source_other: "",
    note: "",
  };
}

function sanitizeDraft(d = {}, locale = "th") {
  const base = getDefaultForm(locale);

  const out = { ...base, ...(d && typeof d === "object" ? d : {}) };

  // numbers
  out.trainee_count = Math.max(1, Number(out.trainee_count || 1));

  // strings
  out.month_interest = String(out.month_interest || "");
  out.year_interest =
    String(out.year_interest || "") ||
    String(YEARS[0] || new Date().getFullYear());

  out.branch = String(out.branch || defaultBranchByLocale(locale)); // ✅ ensure default

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

  out.source_channel = String(out.source_channel || "").trim();
  out.source_other = String(out.source_other || "").trim();

  return out;
}

function SourceRadio({ value, selected, onSelect, label, dataField }) {
  const active = selected === value;
  return (
    <button
      type="button"
      data-field={dataField}
      onClick={() => onSelect(value)}
      className={cx(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left",
        "bg-black/10 hover:bg-black/15 transition",
        active ? "border-white/35 ring-2 ring-white/15" : "border-white/10"
      )}
    >
      <span
        className={cx(
          "h-4 w-4 rounded-full border flex-none",
          active ? "border-white bg-white" : "border-white/40"
        )}
      />
      <span className="text-sm font-extrabold text-white">{label}</span>
    </button>
  );
}

export default function RegisterStep1Client({ locale = "th", courseSlug }) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);
  const [thDb, setThDb] = useState(null);

  // ✅ init form from session draft
  const [form, setForm] = useState(() => {
    if (typeof window === "undefined")
      return sanitizeDraft(getDefaultForm(locale), locale);
    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      const parsed = raw ? JSON.parse(raw) : {};
      return sanitizeDraft(
        {
          ...parsed,
          courseSlug,
          locale,
        },
        locale
      );
    } catch {
      return sanitizeDraft({ courseSlug, locale }, locale);
    }
  });

  // ✅ validation state (per-field)
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const showError = (name) => submitted || touched[name];

  const markTouched = (name) => () =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const clearErrorOnChange = (name) => (e) => {
    const v = e?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [name]: v }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

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
          sanitizeDraft(
            {
              ...getDefaultForm(locale),
              ...prev,
              courseSlug,
              locale,
              // ensure default branch if empty
              branch: prev.branch || defaultBranchByLocale(locale),
            },
            locale
          )
        );
        return;
      }
      const parsed = JSON.parse(raw);
      setForm((prev) =>
        sanitizeDraft(
          {
            ...prev,
            ...parsed,
            courseSlug,
            locale,
            branch:
              String(parsed?.branch || "").trim() ||
              String(prev.branch || "").trim() ||
              defaultBranchByLocale(locale),
          },
          locale
        )
      );
    } catch {
      setForm((prev) =>
        sanitizeDraft(
          {
            ...prev,
            courseSlug,
            locale,
            branch: prev.branch || defaultBranchByLocale(locale),
          },
          locale
        )
      );
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
  const setProvince = (e) => {
    const province = e.target.value;
    setForm((prev) => ({
      ...prev,
      province,
      district: "",
      subdistrict: "",
      postcode: "",
    }));
    // clear related errors when change chain
    setErrors((prev) => {
      const {
        province: _p,
        district: _d,
        subdistrict: _s,
        postcode: _pc,
        ...rest
      } = prev;
      return rest;
    });
  };

  const setDistrict = (e) => {
    const district = e.target.value;
    setForm((prev) => ({
      ...prev,
      district,
      subdistrict: "",
      postcode: "",
    }));
    setErrors((prev) => {
      const { district: _d, subdistrict: _s, postcode: _pc, ...rest } = prev;
      return rest;
    });
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
    setErrors((prev) => {
      const { subdistrict: _s, postcode: _pc, ...rest } = prev;
      return rest;
    });
  };

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "";

  // ✅ per-field validation
  function validateStep1Fields() {
    const e = {};
    const t = (x) => String(x || "").trim();

    // section 1 (required)
    if (!t(form.trainee_count))
      e.trainee_count = isEN ? "Required" : "กรุณาระบุจำนวนผู้เข้าอบรม";
    if (!t(form.month_interest))
      e.month_interest = isEN ? "Required" : "กรุณาเลือกเดือนที่สนใจ";
    if (!t(form.year_interest))
      e.year_interest = isEN ? "Required" : "กรุณาเลือกปีที่สนใจ";
    if (!t(form.training_location))
      e.training_location = isEN ? "Required" : "กรุณาระบุสถานที่อบรม";

    // section 2 (required)
    if (!t(form.first_name)) e.first_name = isEN ? "Required" : "กรุณากรอกชื่อ";
    if (!t(form.last_name))
      e.last_name = isEN ? "Required" : "กรุณากรอกนามสกุล";

    if (!t(form.contact_phone_raw))
      e.contact_phone_raw = isEN ? "Required" : "กรุณากรอกเบอร์โทรติดต่อ";
    else if (!contactPhone.valid)
      e.contact_phone_raw = isEN
        ? "Invalid phone format"
        : "รูปแบบเบอร์โทรไม่ถูกต้อง";

    if (!t(form.email)) e.email = isEN ? "Required" : "กรุณากรอกอีเมล";
    else if (!isValidEmail(form.email))
      e.email = isEN ? "Invalid email format" : "รูปแบบอีเมลไม่ถูกต้อง";

    // section 3 (required)
    if (!t(form.company)) e.company = isEN ? "Required" : "กรุณากรอกบริษัท";
    if (!t(form.branch)) e.branch = isEN ? "Required" : "กรุณาระบุสาขา";

    if (!t(form.tax_id))
      e.tax_id = isEN ? "Required" : "กรุณากรอกเลขประจำตัวผู้เสียภาษี";
    else if (String(form.tax_id).replace(/\D/g, "").length !== 13)
      e.tax_id = isEN
        ? "Tax ID must be 13 digits"
        : "เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก";

    if (!t(form.receipt_address))
      e.receipt_address = isEN ? "Required" : "กรุณากรอกที่อยู่ออกใบเสร็จ";

    if (!t(form.source_channel))
      e.source_channel = isEN
        ? "Please select a channel"
        : "กรุณาเลือกช่องทางรับข่าวสาร";

    if (t(form.source_channel) === "other" && !t(form.source_other))
      e.source_other = isEN ? "Please specify" : "กรุณาระบุช่องทางอื่นๆ";

    // ✅ ถ้าคุณต้องการ “บังคับ” จังหวัด/อำเภอ/ตำบลด้วย ให้ปลดคอมเมนต์ 3 บรรทัดนี้
    // if (!t(form.province)) e.province = isEN ? "Required" : "กรุณาเลือกจังหวัด";
    // if (!t(form.district)) e.district = isEN ? "Required" : "กรุณาเลือกอำเภอ/เขต";
    // if (!t(form.subdistrict)) e.subdistrict = isEN ? "Required" : "กรุณาเลือกตำบล/แขวง";

    return e;
  }

  async function onNext() {
    setSubmitted(true);

    const e = validateStep1Fields();
    setErrors(e);

    if (Object.keys(e).length) {
      const firstKey = Object.keys(e)[0];
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el?.scrollIntoView)
        el.scrollIntoView({ behavior: "smooth", block: "center" });
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
    setForm(
      sanitizeDraft({ ...getDefaultForm(locale), courseSlug, locale }, locale)
    );
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }

  function setSourceChannel(v) {
    setForm((prev) => ({
      ...prev,
      source_channel: v,
      source_other: v === "other" ? prev.source_other : "",
    }));
    setErrors((prev) => {
      const { source_channel, source_other, ...rest } = prev;
      return rest;
    });
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl mt-32 px-4 py-10 text-white">
        <div className="text-2xl font-extrabold">Loading...</div>
        <div className="mt-2 text-white/60">กำลังพาท่านไปยังหน้าลงทะเบียน</div>
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
    <div className="mx-auto max-w-7xl mt-24 ">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        {/* header */}
        <div className="flex flex-wrap justify-between">
          <button
            onClick={onBack}
            className=" rounded-2xl bg-white/10 px-5 py-2 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={onResetDraft}
            className=" rounded-2xl bg-rose-500/15 px-5 text-sm font-bold text-rose-100 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
          >
            {isEN ? "Clear" : "ล้างข้อมูล"}
          </button>
        </div>
        <div className="mt-4">
          <div className="text-4xl font-extrabold text-white text-center">
            {isEN ? "Register" : "ลงทะเบียน"}
          </div>
          <div className="mt-2 text-sm text-white/60 text-center">
            {isEN
              ? "Fill in information for registration inquiry"
              : "กรอกข้อมูลเพื่อส่งความสนใจลงทะเบียน"}
          </div>
        </div>
        <div className="mt-6">
          <StepBar current={1} locale={locale} />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {/* <div className="text-2xl font-extrabold text-white">
              {isEN ? "Register" : "ลงทะเบียน"}
            </div>
            <div className="mt-2 text-sm text-white/60">
              {isEN
                ? "Fill in information for registration inquiry"
                : "กรอกข้อมูลเพื่อส่งความสนใจลงทะเบียน"}
            </div> */}

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
                  {isEN ? "Course" : "หลักสูตร"}{" "}
                  <div className="text-white">{courseTitle}</div>
                </div>
                {/* {course?.title_en && !isEN ? (
                  <div className="mt-1 text-sm text-white/50">
                    {course.title_en}
                  </div>
                ) : null} */}
              </div>
            </div>
          </div>

          {/* <div className="flex flex-wrap gap-2">
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
          </div> */}
        </div>

        {/* <div className="mt-6">
          <StepBar current={1} locale={locale} />
        </div> */}

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
                  error={showError("trainee_count") ? errors.trainee_count : ""}
                >
                  <Input
                    type="number"
                    value={form.trainee_count}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value || 1));
                      setForm((prev) => ({ ...prev, trainee_count: v }));
                      setErrors((prev) => {
                        if (!prev.trainee_count) return prev;
                        const { trainee_count, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onBlur={markTouched("trainee_count")}
                    error={
                      showError("trainee_count") ? errors.trainee_count : ""
                    }
                    dataField="trainee_count"
                    placeholder="1"
                  />
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field
                  label={isEN ? "Interested month" : "เดือนที่สนใจอบรม"}
                  required
                  error={
                    showError("month_interest") ? errors.month_interest : ""
                  }
                >
                  <Select
                    value={form.month_interest}
                    onChange={clearErrorOnChange("month_interest")}
                    onBlur={markTouched("month_interest")}
                    error={
                      showError("month_interest") ? errors.month_interest : ""
                    }
                    dataField="month_interest"
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
                <Field
                  label={isEN ? "Interested year" : "ปีที่สนใจ"}
                  required
                  error={showError("year_interest") ? errors.year_interest : ""}
                >
                  <Select
                    value={form.year_interest}
                    onChange={clearErrorOnChange("year_interest")}
                    onBlur={markTouched("year_interest")}
                    error={
                      showError("year_interest") ? errors.year_interest : ""
                    }
                    dataField="year_interest"
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
                  error={
                    showError("training_location")
                      ? errors.training_location
                      : ""
                  }
                >
                  <Textarea
                    value={form.training_location}
                    onChange={clearErrorOnChange("training_location")}
                    onBlur={markTouched("training_location")}
                    error={
                      showError("training_location")
                        ? errors.training_location
                        : ""
                    }
                    dataField="training_location"
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
                <Field
                  label={isEN ? "First name" : "ชื่อ"}
                  required
                  error={showError("first_name") ? errors.first_name : ""}
                >
                  <Input
                    value={form.first_name}
                    onChange={clearErrorOnChange("first_name")}
                    onBlur={markTouched("first_name")}
                    error={showError("first_name") ? errors.first_name : ""}
                    dataField="first_name"
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Last name" : "นามสกุล"}
                  required
                  error={showError("last_name") ? errors.last_name : ""}
                >
                  <Input
                    value={form.last_name}
                    onChange={clearErrorOnChange("last_name")}
                    onBlur={markTouched("last_name")}
                    error={showError("last_name") ? errors.last_name : ""}
                    dataField="last_name"
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field label={isEN ? "Position" : "ตำแหน่ง"}>
                  <Input
                    value={form.position}
                    onChange={clearErrorOnChange("position")}
                    onBlur={markTouched("position")}
                    dataField="position"
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field label={isEN ? "Department" : "แผนก"}>
                  <Input
                    value={form.department}
                    onChange={clearErrorOnChange("department")}
                    onBlur={markTouched("department")}
                    dataField="department"
                    placeholder=""
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Contact phone" : "เบอร์โทรติดต่อ"}
                  required
                  hint="มือถือ: 0xx-xxx-xxxx | เบอร์บ้าน: 0x-xxx-xxxx ต่อ 12345"
                  error={
                    showError("contact_phone_raw")
                      ? errors.contact_phone_raw
                      : ""
                  }
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
                      setErrors((prev) => {
                        if (!prev.contact_phone_raw) return prev;
                        const { contact_phone_raw, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onBlur={markTouched("contact_phone_raw")}
                    error={
                      showError("contact_phone_raw")
                        ? errors.contact_phone_raw
                        : ""
                    }
                    dataField="contact_phone_raw"
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
                        ? isEN
                          ? "Valid phone format"
                          : "รูปแบบเบอร์ถูกต้อง"
                        : isEN
                        ? "Invalid phone format"
                        : "รูปแบบเบอร์ยังไม่ถูกต้อง"}
                    </div>
                  ) : null}
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Email" : "อีเมล"}
                  required
                  error={showError("email") ? errors.email : ""}
                >
                  <Input
                    value={form.email}
                    onChange={clearErrorOnChange("email")}
                    onBlur={markTouched("email")}
                    error={showError("email") ? errors.email : ""}
                    dataField="email"
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
                <Field
                  label={isEN ? "Company" : "บริษัท"}
                  required
                  error={showError("company") ? errors.company : ""}
                >
                  <Input
                    value={form.company}
                    onChange={clearErrorOnChange("company")}
                    onBlur={markTouched("company")}
                    error={showError("company") ? errors.company : ""}
                    dataField="company"
                    placeholder={isEN ? "Company name" : "ชื่อบริษัท"}
                  />
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field
                  label={
                    <span className="inline-flex items-center gap-2">
                      {isEN ? "Branch" : "สาขา"}
                      <InfoTip
                        text={
                          isEN
                            ? 'Default is "Head Office". You can change it to a branch name (e.g., "Bangna", "Chiang Mai").'
                            : 'ค่าเริ่มต้นเป็น "สำนักงานใหญ่" หากเป็นสาขาอื่นสามารถแก้ไขได้ เช่น "บางนา", "เชียงใหม่"'
                        }
                      />
                    </span>
                  }
                  required
                  error={showError("branch") ? errors.branch : ""}
                >
                  <Input
                    value={form.branch}
                    onChange={clearErrorOnChange("branch")}
                    onBlur={markTouched("branch")}
                    error={showError("branch") ? errors.branch : ""}
                    dataField="branch"
                    placeholder={defaultBranchByLocale(locale)}
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Tax ID" : "เลขประจำตัวผู้เสียภาษี"}
                  required
                  hint={
                    isEN ? "Digits only, 13 digits" : "ตัวเลขเท่านั้น 13 หลัก"
                  }
                  error={showError("tax_id") ? errors.tax_id : ""}
                >
                  <Input
                    inputMode="numeric"
                    value={form.tax_id}
                    onChange={(e) => {
                      const digits = String(e.target.value || "")
                        .replace(/\D/g, "")
                        .slice(0, 13);
                      setForm((s) => ({ ...s, tax_id: digits }));
                      setErrors((prev) => {
                        if (!prev.tax_id) return prev;
                        const { tax_id, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onBlur={markTouched("tax_id")}
                    error={showError("tax_id") ? errors.tax_id : ""}
                    dataField="tax_id"
                    placeholder={isEN ? "13 digits" : "13 หลัก"}
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Company phone" : "เบอร์โทรบริษัท"}
                  hint={
                    isEN
                      ? "Optional (same format as contact phone)"
                      : "ไม่บังคับ (รองรับรูปแบบเดียวกับเบอร์ติดต่อ)"
                  }
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
                    onBlur={markTouched("company_phone_raw")}
                    dataField="company_phone_raw"
                    placeholder={
                      isEN ? "02-123-4567 ext 123" : "เช่น 02-123-4567 ต่อ 123"
                    }
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
                  error={
                    showError("receipt_address") ? errors.receipt_address : ""
                  }
                >
                  <Textarea
                    value={form.receipt_address}
                    onChange={clearErrorOnChange("receipt_address")}
                    onBlur={markTouched("receipt_address")}
                    error={
                      showError("receipt_address") ? errors.receipt_address : ""
                    }
                    dataField="receipt_address"
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
                  label={isEN ? "Province" : "จังหวัด"}
                  hint={
                    isEN
                      ? "Select province to unlock district"
                      : "เลือกจังหวัดก่อน เพื่อปลดล็อคอำเภอ"
                  }
                >
                  <Select
                    value={form.province}
                    onChange={setProvince}
                    disabled={provinceDisabled}
                    onBlur={markTouched("province")}
                    dataField="province"
                  >
                    <option value="">
                      {thDb
                        ? isEN
                          ? "Select..."
                          : "เลือก..."
                        : isEN
                        ? "Loading..."
                        : "กำลังโหลดฐานข้อมูล..."}
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
                <Field
                  label={isEN ? "District" : "อำเภอ/เขต"}
                  hint={
                    isEN
                      ? "Unlocked after province"
                      : "ปลดล็อคเมื่อเลือกจังหวัดแล้ว"
                  }
                >
                  <Select
                    value={form.district}
                    onChange={setDistrict}
                    disabled={districtDisabled}
                    onBlur={markTouched("district")}
                    dataField="district"
                  >
                    <option value="">
                      {districtDisabled
                        ? isEN
                          ? "Select province first"
                          : "เลือกจังหวัดก่อน"
                        : isEN
                        ? "Select..."
                        : "เลือก..."}
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
                <Field
                  label={isEN ? "Subdistrict" : "ตำบล/แขวง"}
                  hint={
                    isEN
                      ? "Unlocked after district"
                      : "ปลดล็อคเมื่อเลือกอำเภอแล้ว"
                  }
                >
                  <Select
                    value={form.subdistrict}
                    onChange={setSubdistrict}
                    disabled={subdistrictDisabled}
                    onBlur={markTouched("subdistrict")}
                    dataField="subdistrict"
                  >
                    <option value="">
                      {subdistrictDisabled
                        ? isEN
                          ? "Select district first"
                          : "เลือกอำเภอก่อน"
                        : isEN
                        ? "Select..."
                        : "เลือก..."}
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
                <Field
                  label={isEN ? "Postcode" : "รหัสไปรษณีย์"}
                  hint={
                    isEN
                      ? "Auto from subdistrict (read-only)"
                      : "Auto จากตำบล (แก้ไม่ได้)"
                  }
                >
                  <Input
                    value={form.postcode}
                    onChange={() => {}}
                    readOnly
                    dataField="postcode"
                    placeholder={isEN ? "Auto" : "Auto"}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* <Section
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
                onChange={clearErrorOnChange("note")}
                onBlur={markTouched("note")}
                dataField="note"
                placeholder=""
              />
            </Field>
          </Section> */}

          {/* ✅ SECTION 4 (เพิ่มคำถามช่องทางข่าวสาร + note) */}
          <Section
            no={4}
            title={isEN ? "Additional info" : "ข้อมูลเพิ่มเติม"}
            subtitle={
              isEN
                ? "Information source (required) + Note (optional)"
                : "ช่องทางรับข่าวสาร (บังคับ) + หมายเหตุ (ไม่บังคับ)"
            }
          >
            <Field
              label={
                isEN
                  ? "Where did you hear about us?"
                  : "ท่านทราบข้อมูลข่าวสารจากช่องทางใด"
              }
              required
              error={showError("source_channel") ? errors.source_channel : ""}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <SourceRadio
                  value="bitkub"
                  selected={form.source_channel}
                  onSelect={setSourceChannel}
                  label="Bitkub Academy"
                  dataField="source_channel"
                />
                <SourceRadio
                  value="9expert"
                  selected={form.source_channel}
                  onSelect={setSourceChannel}
                  label="9Expert Training"
                  dataField="source_channel"
                />
                <SourceRadio
                  value="key"
                  selected={form.source_channel}
                  onSelect={setSourceChannel}
                  label="Key Solutions Training"
                  dataField="source_channel"
                />
                <SourceRadio
                  value="other"
                  selected={form.source_channel}
                  onSelect={setSourceChannel}
                  label="Other"
                  dataField="source_channel"
                />
              </div>

              {form.source_channel === "other" ? (
                <div className="mt-3">
                  <Field
                    label={isEN ? "Please specify" : "โปรดระบุ"}
                    required
                    error={showError("source_other") ? errors.source_other : ""}
                  >
                    <Input
                      value={form.source_other}
                      onChange={clearErrorOnChange("source_other")}
                      onBlur={markTouched("source_other")}
                      error={
                        showError("source_other") ? errors.source_other : ""
                      }
                      dataField="source_other"
                      placeholder={
                        isEN
                          ? "e.g., Facebook, Friend, TikTok..."
                          : "เช่น Facebook, เพื่อนแนะนำ, TikTok..."
                      }
                    />
                  </Field>
                </div>
              ) : null}
            </Field>

            <div className="mt-6">
              <Field
                label={
                  isEN
                    ? "Note / Ask for more information"
                    : "Note / Ask for more information"
                }
              >
                <Textarea
                  value={form.note}
                  onChange={clearErrorOnChange("note")}
                  onBlur={markTouched("note")}
                  dataField="note"
                  placeholder=""
                />
              </Field>
            </div>
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
