// src/app/[locale]/(public)/upcoming-register/[courseSlug]/step-1/UpcomingRegisterStep1Client.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepBar from "@/components/StepBar";
import { ArrowLeft } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function clean(x) {
  return String(x ?? "").trim();
}

function isValidEmail(x) {
  const s = clean(x);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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

/** ✅ draft key แยกจาก inhouse register */
function DraftKey(courseSlug) {
  return `nx-upcoming-register-draft:${String(courseSlug || "").trim()}`;
}

function getDefaultForm(locale = "th", courseSlug = "") {
  return {
    courseSlug,
    locale,

    coordinator: {
      first_name: "",
      last_name: "",
      email: "",
      phone_raw: "",
      phone: "",
    },

    trainee_count: 1,
    coordinator_is_trainee: false,
    no_trainees_yet: false,

    trainees: [
      { first_name: "", last_name: "", email: "", phone_raw: "", phone: "" },
    ],

    tax: {
      type: "personal", // personal | company
      personal_first_name: "",
      personal_last_name: "",

      company_name: "",
      branch: locale === "en" ? "Head Office" : "สำนักงานใหญ่",

      tax_id: "",
      phone_raw: "",
      phone: "",

      address: "",
      province: "",
      district: "",
      subdistrict: "",
      postcode: "",
    },

    source_channel: "",
    source_other: "",
    note: "",
  };
}

function sanitizeDraft(d, locale = "th", courseSlug = "") {
  const base = getDefaultForm(locale, courseSlug);
  const out = { ...base, ...(d && typeof d === "object" ? d : {}) };

  out.courseSlug = courseSlug;
  out.locale = locale;

  // numbers
  const n = Math.max(1, Math.min(50, Number(out.trainee_count || 1)));
  out.trainee_count = n;

  // coordinator phone normalize
  out.coordinator = out.coordinator || {};
  out.coordinator.phone_raw = String(out.coordinator.phone_raw || "").replace(
    /\D/g,
    "",
  );
  // tax normalize
  out.tax = out.tax || {};
  out.tax.tax_id = String(out.tax.tax_id || "")
    .replace(/\D/g, "")
    .slice(0, 13);
  out.tax.phone_raw = String(out.tax.phone_raw || "").replace(/\D/g, "");

  // trainees length
  const arr = Array.isArray(out.trainees) ? out.trainees : [];
  const next = arr.slice(0, n);
  while (next.length < n)
    next.push({
      first_name: "",
      last_name: "",
      email: "",
      phone_raw: "",
      phone: "",
    });
  out.trainees = next.map((x) => ({
    first_name: String(x?.first_name || ""),
    last_name: String(x?.last_name || ""),
    email: String(x?.email || ""),
    phone_raw: String(x?.phone_raw || "").replace(/\D/g, ""),
    phone: String(x?.phone || ""),
  }));

  return out;
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
        <div className="mt-2 text-xs text-white/45">{hint}</div>
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
        disabled || readOnly ? "opacity-60 cursor-not-allowed" : "",
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
        disabled ? "opacity-60 cursor-not-allowed" : "",
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
        "h-11 w-full rounded-2xl border bg-black/15 px-4 text-sm text-white outline-none themed-select",
        "focus:ring-2",
        error
          ? "border-rose-400/50 focus:border-rose-300/70 focus:ring-rose-400/15"
          : "border-white/10 focus:border-white/20 focus:ring-white/10",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      )}
    >
      {children}
    </select>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
      <div className="text-lg font-extrabold text-white">{title}</div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function UpcomingRegisterStep1Client({
  locale = "th",
  courseSlug,
}) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);
  const [thDb, setThDb] = useState(null);

  const [form, setForm] = useState(() => {
    if (typeof window === "undefined")
      return getDefaultForm(locale, courseSlug);
    try {
      const raw = sessionStorage.getItem(DraftKey(courseSlug));
      const parsed = raw ? JSON.parse(raw) : null;
      return sanitizeDraft(parsed, locale, courseSlug);
    } catch {
      return getDefaultForm(locale, courseSlug);
    }
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const showError = (name) => submitted || touched[name];
  const markTouched = (name) => () =>
    setTouched((p) => ({ ...p, [name]: true }));

  // fetch course
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

  // load thailand postcode db (เหมือน register เดิม)
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

  // persist draft
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DraftKey(courseSlug),
        JSON.stringify({ ...form, _updatedAt: Date.now() }),
      );
    } catch {}
  }, [form, courseSlug]);

  // phone derived
  const coordinatorPhone = useMemo(
    () => formatThaiPhone(form.coordinator.phone_raw),
    [form.coordinator.phone_raw],
  );
  const taxPhone = useMemo(
    () => formatThaiPhone(form.tax.phone_raw),
    [form.tax.phone_raw],
  );

  // sync digits fields
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      coordinator: {
        ...prev.coordinator,
        phone: coordinatorPhone.digits || "",
      },
      tax: { ...prev.tax, phone: taxPhone.digits || "" },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinatorPhone.digits, taxPhone.digits]);

  // keep trainees length in sync + lock trainee[0] if coordinator_is_trainee
  useEffect(() => {
    const n = Math.max(1, Math.min(50, Number(form.trainee_count || 1)));

    setForm((prev) => {
      const next = { ...prev, trainee_count: n };
      const arr = Array.isArray(next.trainees) ? next.trainees.slice(0, n) : [];
      while (arr.length < n)
        arr.push({
          first_name: "",
          last_name: "",
          email: "",
          phone_raw: "",
          phone: "",
        });

      // if coordinator is trainee, sync first row
      if (!next.no_trainees_yet && next.coordinator_is_trainee) {
        arr[0] = {
          first_name: next.coordinator.first_name,
          last_name: next.coordinator.last_name,
          email: next.coordinator.email,
          phone_raw: next.coordinator.phone_raw,
          phone: next.coordinator.phone,
        };
      }

      // normalize phones in trainees
      const normalized = arr.map((x) => {
        const raw = String(x?.phone_raw || "").replace(/\D/g, "");
        const f = formatThaiPhone(raw);
        return {
          first_name: String(x?.first_name || ""),
          last_name: String(x?.last_name || ""),
          email: String(x?.email || ""),
          phone_raw: raw,
          phone: f.digits || "",
        };
      });

      next.trainees = normalized;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.trainee_count,
    form.coordinator_is_trainee,
    form.no_trainees_yet,
    form.coordinator.first_name,
    form.coordinator.last_name,
    form.coordinator.email,
    form.coordinator.phone_raw,
    form.coordinator.phone,
  ]);

  // if no trainees yet -> force off coordinator_is_trainee
  useEffect(() => {
    if (!form.no_trainees_yet) return;
    if (!form.coordinator_is_trainee) return;
    setForm((s) => ({ ...s, coordinator_is_trainee: false }));
  }, [form.no_trainees_yet, form.coordinator_is_trainee]);

  // address options (เหมือน register เดิม)
  const provinceOptions = useMemo(() => {
    if (!thDb) return [];
    return Object.keys(thDb).sort((a, b) => a.localeCompare(b, "th"));
  }, [thDb]);

  const districtOptions = useMemo(() => {
    if (!thDb || !form.tax.province) return [];
    const p = thDb[form.tax.province];
    if (!p) return [];
    return Object.keys(p).sort((a, b) => a.localeCompare(b, "th"));
  }, [thDb, form.tax.province]);

  const subdistrictOptions = useMemo(() => {
    if (!thDb || !form.tax.province || !form.tax.district) return [];
    const d = thDb?.[form.tax.province]?.[form.tax.district];
    if (!d) return [];
    return Object.keys(d).sort((a, b) => a.localeCompare(b, "th"));
  }, [thDb, form.tax.province, form.tax.district]);

  const provinceDisabled = !thDb;
  const districtDisabled = !thDb || !form.tax.province;
  const subdistrictDisabled = !thDb || !form.tax.province || !form.tax.district;

  const setProvince = (e) => {
    const province = e.target.value;
    setForm((prev) => ({
      ...prev,
      tax: {
        ...prev.tax,
        province,
        district: "",
        subdistrict: "",
        postcode: "",
      },
    }));
  };

  const setDistrict = (e) => {
    const district = e.target.value;
    setForm((prev) => ({
      ...prev,
      tax: { ...prev.tax, district, subdistrict: "", postcode: "" },
    }));
  };

  const setSubdistrict = (e) => {
    const subdistrict = e.target.value;
    let postcode = "";
    if (thDb && form.tax.province && form.tax.district && subdistrict) {
      postcode = String(
        thDb?.[form.tax.province]?.[form.tax.district]?.[subdistrict] || "",
      );
    }
    setForm((prev) => ({
      ...prev,
      tax: { ...prev.tax, subdistrict, postcode },
    }));
  };

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "Course";

  function validate() {
    const e = {};
    const c = form.coordinator;

    if (!clean(c.first_name))
      e["coordinator.first_name"] = isEN ? "Required" : "กรุณากรอกชื่อ";
    if (!clean(c.last_name))
      e["coordinator.last_name"] = isEN ? "Required" : "กรุณากรอกนามสกุล";
    if (!isValidEmail(c.email))
      e["coordinator.email"] = isEN ? "Invalid email" : "อีเมลไม่ถูกต้อง";
    if (!c.phone_raw)
      e["coordinator.phone_raw"] = isEN ? "Required" : "กรุณากรอกเบอร์โทร";
    else if (!coordinatorPhone.valid)
      e["coordinator.phone_raw"] = isEN
        ? "Invalid phone"
        : "รูปแบบเบอร์ไม่ถูกต้อง";

    const n = Math.max(1, Math.min(50, Number(form.trainee_count || 1)));
    if (!form.no_trainees_yet) {
      for (let i = 0; i < n; i++) {
        const tr = form.trainees[i] || {};
        const key = (k) => `trainees.${i}.${k}`;

        if (!clean(tr.first_name))
          e[key("first_name")] = isEN ? "Required" : "กรุณากรอกชื่อ";
        if (!clean(tr.last_name))
          e[key("last_name")] = isEN ? "Required" : "กรุณากรอกนามสกุล";
        if (!isValidEmail(tr.email))
          e[key("email")] = isEN ? "Invalid email" : "อีเมลไม่ถูกต้อง";

        const fp = formatThaiPhone(tr.phone_raw);
        if (!tr.phone_raw)
          e[key("phone_raw")] = isEN ? "Required" : "กรุณากรอกเบอร์โทร";
        else if (!fp.valid)
          e[key("phone_raw")] = isEN
            ? "Invalid phone"
            : "รูปแบบเบอร์ไม่ถูกต้อง";
      }
    }

    // tax
    if (form.tax.type === "personal") {
      if (!clean(form.tax.personal_first_name))
        e["tax.personal_first_name"] = isEN ? "Required" : "กรุณากรอกชื่อ";
      if (!clean(form.tax.personal_last_name))
        e["tax.personal_last_name"] = isEN ? "Required" : "กรุณากรอกนามสกุล";
    } else {
      if (!clean(form.tax.company_name))
        e["tax.company_name"] = isEN ? "Required" : "กรุณากรอกชื่อบริษัท";
      if (!clean(form.tax.branch))
        e["tax.branch"] = isEN ? "Required" : "กรุณาระบุสาขา";
    }

    const tid = String(form.tax.tax_id || "").replace(/\D/g, "");
    if (tid && tid.length !== 13)
      e["tax.tax_id"] = isEN ? "Must be 13 digits" : "ต้องเป็น 13 หลัก";

    if (!clean(form.tax.address))
      e["tax.address"] = isEN ? "Required" : "กรุณากรอกที่อยู่";
    if (!clean(form.tax.province))
      e["tax.province"] = isEN ? "Required" : "กรุณาเลือกจังหวัด";
    if (!clean(form.tax.district))
      e["tax.district"] = isEN ? "Required" : "กรุณาเลือกอำเภอ/เขต";
    if (!clean(form.tax.subdistrict))
      e["tax.subdistrict"] = isEN ? "Required" : "กรุณาเลือกตำบล/แขวง";
    if (!clean(form.tax.postcode))
      e["tax.postcode"] = isEN ? "Required" : "กรุณาเลือกรหัสไปรษณีย์";

    // source
    if (!clean(form.source_channel))
      e["source_channel"] = isEN ? "Required" : "กรุณาเลือกช่องทางรับข่าวสาร";
    if (form.source_channel === "Other" && !clean(form.source_other))
      e["source_other"] = isEN ? "Required" : "กรุณาระบุช่องทางอื่น";

    return e;
  }

  function scrollToFirstError(e) {
    const firstKey = Object.keys(e)[0];
    if (!firstKey) return;
    const el = document.querySelector(`[data-field="${firstKey}"]`);
    if (el?.scrollIntoView)
      el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function onReset() {
    if (!confirm(isEN ? "Clear all form data?" : "ล้างข้อมูลที่กรอกทั้งหมด?"))
      return;
    try {
      sessionStorage.removeItem(DraftKey(courseSlug));
    } catch {}
    setForm(getDefaultForm(locale, courseSlug));
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }

  function onNext() {
    setSubmitted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      scrollToFirstError(e);
      return;
    }
    router.push(
      `/${locale}/upcoming-register/${encodeURIComponent(courseSlug)}/step-2`,
    );
  }

  return (
    <div className="mx-auto max-w-7xl mt-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        {/* header buttons */}
        <div className="flex flex-wrap justify-between gap-3">
          <button
            onClick={() =>
              router.push(
                `/${locale}/courses/${encodeURIComponent(courseSlug)}`,
              )
            }
            className="rounded-2xl bg-white/10 px-5 py-2 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <ArrowLeft />
          </button>

          <button
            onClick={onReset}
            className="rounded-2xl bg-rose-500/15 px-5 py-2 text-sm font-bold text-rose-100 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
          >
            {isEN ? "Clear" : "ล้างข้อมูล"}
          </button>
        </div>

        {/* title + step */}
        <div className="mt-4 text-center">
          <div className="text-4xl font-extrabold text-white">
            {isEN ? "Register" : "ลงทะเบียน"}
          </div>
          <div className="mt-2 text-sm text-white/60">
            {isEN
              ? "Fill in information for upcoming class registration"
              : "กรอกข้อมูลเพื่อส่งคำขอลงทะเบียน (คลาสที่กำลังจะมาถึง)"}
          </div>
        </div>

        <div className="mt-6">
          <StepBar current={1} locale={locale} />
        </div>

        {/* course card */}
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
              {isEN ? "Course" : "หลักสูตร"}{" "}
              <div className="text-white">{courseTitle}</div>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="mt-8 grid gap-6">
          {/* Coordinator */}
          <Section title={isEN ? "Coordinator" : "ข้อมูลผู้ประสานงาน"}>
            <div className="grid gap-5 md:grid-cols-12">
              <div className="md:col-span-6">
                <Field
                  label={isEN ? "First name" : "ชื่อ"}
                  required
                  error={
                    showError("coordinator.first_name")
                      ? errors["coordinator.first_name"]
                      : ""
                  }
                >
                  <Input
                    dataField="coordinator.first_name"
                    value={form.coordinator.first_name}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        coordinator: {
                          ...s.coordinator,
                          first_name: e.target.value,
                        },
                      }))
                    }
                    onBlur={markTouched("coordinator.first_name")}
                    error={
                      showError("coordinator.first_name")
                        ? errors["coordinator.first_name"]
                        : ""
                    }
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Last name" : "นามสกุล"}
                  required
                  error={
                    showError("coordinator.last_name")
                      ? errors["coordinator.last_name"]
                      : ""
                  }
                >
                  <Input
                    dataField="coordinator.last_name"
                    value={form.coordinator.last_name}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        coordinator: {
                          ...s.coordinator,
                          last_name: e.target.value,
                        },
                      }))
                    }
                    onBlur={markTouched("coordinator.last_name")}
                    error={
                      showError("coordinator.last_name")
                        ? errors["coordinator.last_name"]
                        : ""
                    }
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label="E-mail"
                  required
                  error={
                    showError("coordinator.email")
                      ? errors["coordinator.email"]
                      : ""
                  }
                >
                  <Input
                    dataField="coordinator.email"
                    value={form.coordinator.email}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        coordinator: {
                          ...s.coordinator,
                          email: e.target.value,
                        },
                      }))
                    }
                    onBlur={markTouched("coordinator.email")}
                    error={
                      showError("coordinator.email")
                        ? errors["coordinator.email"]
                        : ""
                    }
                    placeholder="example@email.com"
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Phone" : "เบอร์ติดต่อ"}
                  required
                  hint={
                    isEN
                      ? "Supports mobile/landline format"
                      : "รองรับเบอร์มือถือ/บ้าน และต่อ"
                  }
                  error={
                    showError("coordinator.phone_raw")
                      ? errors["coordinator.phone_raw"]
                      : ""
                  }
                >
                  <Input
                    dataField="coordinator.phone_raw"
                    inputMode="tel"
                    value={coordinatorPhone.formatted}
                    onChange={(e) => {
                      const digits = String(e.target.value || "").replace(
                        /\D/g,
                        "",
                      );
                      setForm((s) => ({
                        ...s,
                        coordinator: { ...s.coordinator, phone_raw: digits },
                      }));
                    }}
                    onBlur={markTouched("coordinator.phone_raw")}
                    error={
                      showError("coordinator.phone_raw")
                        ? errors["coordinator.phone_raw"]
                        : ""
                    }
                    placeholder="เช่น 089-123-4567 หรือ 02-123-4567 ต่อ 123"
                  />
                </Field>
              </div>

              <div className="md:col-span-12 flex flex-col gap-3">
                <label className="inline-flex items-center gap-3 text-sm font-extrabold text-white/90">
                  <input
                    type="checkbox"
                    checked={form.coordinator_is_trainee}
                    disabled={form.no_trainees_yet}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        coordinator_is_trainee: e.target.checked,
                      }))
                    }
                  />
                  {isEN
                    ? "Coordinator is also a trainee"
                    : "ผู้ประสานงานเป็นผู้เข้าอบรม"}
                </label>

                <div className="grid gap-3 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-4">
                    <Field
                      label={isEN ? "Trainee count" : "จำนวนผู้สมัคร"}
                      required

                    >
                      <Input
                        dataField="trainee_count"
                        type="number"
                        value={form.trainee_count}
                        onChange={(e) => {
                          const v = Math.max(
                            1,
                            Math.min(50, Number(e.target.value || 1)),
                          );
                          setForm((s) => ({ ...s, trainee_count: v }));
                        }}
                      />
                    </Field>
                  </div>
                </div>
                <div className="md:col-span-8">
                  <label className="inline-flex items-center gap-3 text-sm font-extrabold text-white/90">
                    <input
                      type="checkbox"
                      checked={form.no_trainees_yet}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          no_trainees_yet: e.target.checked,
                        }))
                      }
                    />
                    {isEN
                      ? "I don't want to provide trainee names yet"
                      : "ยังไม่ประสงค์แจ้งรายชื่อผู้เข้าอบรม"}
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Trainees */}
          {!form.no_trainees_yet ? (
            <Section title={isEN ? "Trainees" : "ผู้เข้าอบรม"}>
              <div className="grid gap-5">
                {form.trainees.map((tr, idx) => {
                  const locked = form.coordinator_is_trainee && idx === 0;

                  const key = (k) => `trainees.${idx}.${k}`;
                  const phoneFmt = formatThaiPhone(tr.phone_raw);

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-black/15 p-5"
                    >
                      <div className="text-lg font-extrabold text-white">
                        {isEN
                          ? `Trainee #${idx + 1}`
                          : `ผู้เข้าอบรมท่านที่ ${idx + 1}`}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <Field
                            label={isEN ? "First name" : "ชื่อ"}
                            required
                            error={
                              showError(key("first_name"))
                                ? errors[key("first_name")]
                                : ""
                            }
                          >
                            <Input
                              dataField={key("first_name")}
                              value={tr.first_name}
                              disabled={locked}
                              onChange={(e) =>
                                setForm((s) => {
                                  const next = { ...s };
                                  const arr = next.trainees.slice();
                                  arr[idx] = {
                                    ...arr[idx],
                                    first_name: e.target.value,
                                  };
                                  next.trainees = arr;
                                  return next;
                                })
                              }
                              onBlur={markTouched(key("first_name"))}
                              error={
                                showError(key("first_name"))
                                  ? errors[key("first_name")]
                                  : ""
                              }
                              placeholder={
                                locked
                                  ? isEN
                                    ? "Edit in coordinator section"
                                    : "แก้จากช่องผู้ประสานงาน"
                                  : ""
                              }
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-6">
                          <Field
                            label={isEN ? "Last name" : "นามสกุล"}
                            required
                            error={
                              showError(key("last_name"))
                                ? errors[key("last_name")]
                                : ""
                            }
                          >
                            <Input
                              dataField={key("last_name")}
                              value={tr.last_name}
                              disabled={locked}
                              onChange={(e) =>
                                setForm((s) => {
                                  const next = { ...s };
                                  const arr = next.trainees.slice();
                                  arr[idx] = {
                                    ...arr[idx],
                                    last_name: e.target.value,
                                  };
                                  next.trainees = arr;
                                  return next;
                                })
                              }
                              onBlur={markTouched(key("last_name"))}
                              error={
                                showError(key("last_name"))
                                  ? errors[key("last_name")]
                                  : ""
                              }
                              placeholder={
                                locked
                                  ? isEN
                                    ? "Edit in coordinator section"
                                    : "แก้จากช่องผู้ประสานงาน"
                                  : ""
                              }
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-6">
                          <Field
                            label="Email"
                            required
                            error={
                              showError(key("email"))
                                ? errors[key("email")]
                                : ""
                            }
                          >
                            <Input
                              dataField={key("email")}
                              value={tr.email}
                              disabled={locked}
                              onChange={(e) =>
                                setForm((s) => {
                                  const next = { ...s };
                                  const arr = next.trainees.slice();
                                  arr[idx] = {
                                    ...arr[idx],
                                    email: e.target.value,
                                  };
                                  next.trainees = arr;
                                  return next;
                                })
                              }
                              onBlur={markTouched(key("email"))}
                              error={
                                showError(key("email"))
                                  ? errors[key("email")]
                                  : ""
                              }
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-6">
                          <Field
                            label={isEN ? "Phone" : "เบอร์โทรศัพท์"}
                            required
                            error={
                              showError(key("phone_raw"))
                                ? errors[key("phone_raw")]
                                : ""
                            }
                          >
                            <Input
                              dataField={key("phone_raw")}
                              inputMode="tel"
                              value={phoneFmt.formatted}
                              disabled={locked}
                              onChange={(e) => {
                                const digits = String(
                                  e.target.value || "",
                                ).replace(/\D/g, "");
                                setForm((s) => {
                                  const next = { ...s };
                                  const arr = next.trainees.slice();
                                  arr[idx] = { ...arr[idx], phone_raw: digits };
                                  next.trainees = arr;
                                  return next;
                                });
                              }}
                              onBlur={markTouched(key("phone_raw"))}
                              error={
                                showError(key("phone_raw"))
                                  ? errors[key("phone_raw")]
                                  : ""
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {/* Tax */}
          <Section
            title={
              isEN ? "Tax Invoice / Receipt" : "ใบกำกับภาษี / ใบเสร็จรับเงิน"
            }
          >
            <div className="flex flex-wrap items-center gap-6 text-sm font-extrabold text-white/90">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.tax.type === "personal"}
                  onChange={() =>
                    setForm((s) => ({
                      ...s,
                      tax: { ...s.tax, type: "personal" },
                    }))
                  }
                />
                {isEN ? "Personal" : "บุคคลทั่วไป"}
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.tax.type === "company"}
                  onChange={() =>
                    setForm((s) => ({
                      ...s,
                      tax: { ...s.tax, type: "company" },
                    }))
                  }
                />
                {isEN ? "Company" : "นิติบุคคล / บริษัท"}
              </label>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-12">
              {form.tax.type === "personal" ? (
                <>
                  <div className="md:col-span-6">
                    <Field
                      label={isEN ? "First name" : "ชื่อ"}
                      required
                      error={
                        showError("tax.personal_first_name")
                          ? errors["tax.personal_first_name"]
                          : ""
                      }
                    >
                      <Input
                        dataField="tax.personal_first_name"
                        value={form.tax.personal_first_name}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            tax: {
                              ...s.tax,
                              personal_first_name: e.target.value,
                            },
                          }))
                        }
                        onBlur={markTouched("tax.personal_first_name")}
                        error={
                          showError("tax.personal_first_name")
                            ? errors["tax.personal_first_name"]
                            : ""
                        }
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-6">
                    <Field
                      label={isEN ? "Last name" : "นามสกุล"}
                      required
                      error={
                        showError("tax.personal_last_name")
                          ? errors["tax.personal_last_name"]
                          : ""
                      }
                    >
                      <Input
                        dataField="tax.personal_last_name"
                        value={form.tax.personal_last_name}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            tax: {
                              ...s.tax,
                              personal_last_name: e.target.value,
                            },
                          }))
                        }
                        onBlur={markTouched("tax.personal_last_name")}
                        error={
                          showError("tax.personal_last_name")
                            ? errors["tax.personal_last_name"]
                            : ""
                        }
                      />
                    </Field>
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-8">
                    <Field
                      label={
                        isEN
                          ? "Company name"
                          : "ชื่อบริษัทสำหรับการออกใบกำกับภาษี"
                      }
                      required
                      error={
                        showError("tax.company_name")
                          ? errors["tax.company_name"]
                          : ""
                      }
                    >
                      <Input
                        dataField="tax.company_name"
                        value={form.tax.company_name}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            tax: { ...s.tax, company_name: e.target.value },
                          }))
                        }
                        onBlur={markTouched("tax.company_name")}
                        error={
                          showError("tax.company_name")
                            ? errors["tax.company_name"]
                            : ""
                        }
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-4">
                    <Field
                      label={isEN ? "Branch" : "สาขา"}
                      required
                      error={
                        showError("tax.branch") ? errors["tax.branch"] : ""
                      }
                    >
                      <Input
                        dataField="tax.branch"
                        value={form.tax.branch}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            tax: { ...s.tax, branch: e.target.value },
                          }))
                        }
                        onBlur={markTouched("tax.branch")}
                        error={
                          showError("tax.branch") ? errors["tax.branch"] : ""
                        }
                        placeholder={isEN ? "Head Office" : "สำนักงานใหญ่"}
                      />
                    </Field>
                  </div>
                </>
              )}

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Tax ID" : "เลขประจำตัวผู้เสียภาษี"}
                  error={showError("tax.tax_id") ? errors["tax.tax_id"] : ""}
                >
                  <Input
                    dataField="tax.tax_id"
                    inputMode="numeric"
                    value={form.tax.tax_id}
                    onChange={(e) => {
                      const digits = String(e.target.value || "")
                        .replace(/\D/g, "")
                        .slice(0, 13);
                      setForm((s) => ({
                        ...s,
                        tax: { ...s.tax, tax_id: digits },
                      }));
                    }}
                    onBlur={markTouched("tax.tax_id")}
                    error={showError("tax.tax_id") ? errors["tax.tax_id"] : ""}
                    placeholder="13 หลัก"
                  />
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field
                  label={isEN ? "Phone (optional)" : "เบอร์ติดต่อ (ไม่บังคับ)"}
                >
                  <Input
                    dataField="tax.phone_raw"
                    inputMode="tel"
                    value={taxPhone.formatted}
                    onChange={(e) => {
                      const digits = String(e.target.value || "").replace(
                        /\D/g,
                        "",
                      );
                      setForm((s) => ({
                        ...s,
                        tax: { ...s.tax, phone_raw: digits },
                      }));
                    }}
                    placeholder="เช่น 02-123-4567 ต่อ 123"
                  />
                </Field>
              </div>

              <div className="md:col-span-12">
                <Field
                  label={
                    isEN
                      ? "Address"
                      : "ที่อยู่สำหรับออกใบกำกับภาษี (รายละเอียด)"
                  }
                  required
                  error={showError("tax.address") ? errors["tax.address"] : ""}
                >
                  <Textarea
                    dataField="tax.address"
                    value={form.tax.address}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        tax: { ...s.tax, address: e.target.value },
                      }))
                    }
                    onBlur={markTouched("tax.address")}
                    error={
                      showError("tax.address") ? errors["tax.address"] : ""
                    }
                    placeholder={
                      isEN
                        ? "Street / Building / etc."
                        : "บ้านเลขที่ ถนน อาคาร ฯลฯ"
                    }
                  />
                </Field>
              </div>

              {/* ✅ จังหวัด/อำเภอ/ตำบล/ไปรษณีย์: แบบเดียวกับ register เดิม */}
              <div className="md:col-span-3">
                <Field
                  label={isEN ? "Province" : "จังหวัด"}
                  required
                  error={
                    showError("tax.province") ? errors["tax.province"] : ""
                  }
                >
                  <Select
                    dataField="tax.province"
                    value={form.tax.province}
                    onChange={setProvince}
                    disabled={provinceDisabled}
                    onBlur={markTouched("tax.province")}
                    error={
                      showError("tax.province") ? errors["tax.province"] : ""
                    }
                  >
                    <option value="">
                      {thDb
                        ? isEN
                          ? "Select..."
                          : "เลือก..."
                        : isEN
                          ? "Loading..."
                          : "กำลังโหลด..."}
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
                  label={isEN ? "District" : "เขต / อำเภอ"}
                  required
                  error={
                    showError("tax.district") ? errors["tax.district"] : ""
                  }
                >
                  <Select
                    dataField="tax.district"
                    value={form.tax.district}
                    onChange={setDistrict}
                    disabled={districtDisabled}
                    onBlur={markTouched("tax.district")}
                    error={
                      showError("tax.district") ? errors["tax.district"] : ""
                    }
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
                  label={isEN ? "Subdistrict" : "แขวง / ตำบล"}
                  required
                  error={
                    showError("tax.subdistrict")
                      ? errors["tax.subdistrict"]
                      : ""
                  }
                >
                  <Select
                    dataField="tax.subdistrict"
                    value={form.tax.subdistrict}
                    onChange={setSubdistrict}
                    disabled={subdistrictDisabled}
                    onBlur={markTouched("tax.subdistrict")}
                    error={
                      showError("tax.subdistrict")
                        ? errors["tax.subdistrict"]
                        : ""
                    }
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
                  required
                  error={
                    showError("tax.postcode") ? errors["tax.postcode"] : ""
                  }
                >
                  <Input
                    dataField="tax.postcode"
                    value={form.tax.postcode}
                    onChange={() => {}}
                    readOnly
                    placeholder="Auto"
                    error={
                      showError("tax.postcode") ? errors["tax.postcode"] : ""
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Source + Note */}
          <Section title={isEN ? "Additional info" : "ข้อมูลเพิ่มเติม"}>
            <div className="grid gap-5 md:grid-cols-12">
              <div className="md:col-span-12">
                <Field
                  label={
                    isEN
                      ? "How did you hear about us?"
                      : "ท่านทราบข้อมูลข่าวสารจากช่องทางใด"
                  }
                  required
                  error={
                    showError("source_channel") ? errors["source_channel"] : ""
                  }
                >
                  <Select
                    dataField="source_channel"
                    value={form.source_channel}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, source_channel: e.target.value }))
                    }
                    onBlur={markTouched("source_channel")}
                    error={
                      showError("source_channel")
                        ? errors["source_channel"]
                        : ""
                    }
                  >
                    <option value="">{isEN ? "Select..." : "เลือก..."}</option>
                    <option value="Bitkub Academy">Bitkub Academy</option>
                    <option value="9Expert Training">9Expert Training</option>
                    <option value="Key Solutions Training">
                      Key Solutions Training
                    </option>
                    <option value="Other">Other</option>
                  </Select>

                  {form.source_channel === "Other" ? (
                    <div className="mt-3">
                      <Field
                        label={isEN ? "Please specify" : "โปรดระบุ"}
                        required
                        error={
                          showError("source_other")
                            ? errors["source_other"]
                            : ""
                        }
                      >
                        <Input
                          dataField="source_other"
                          value={form.source_other}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              source_other: e.target.value,
                            }))
                          }
                          onBlur={markTouched("source_other")}
                          error={
                            showError("source_other")
                              ? errors["source_other"]
                              : ""
                          }
                        />
                      </Field>
                    </div>
                  ) : null}
                </Field>
              </div>

              <div className="md:col-span-12">
                <Field label={isEN ? "Note" : "หมายเหตุ"}>
                  <Textarea
                    dataField="note"
                    value={form.note}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, note: e.target.value }))
                    }
                    placeholder={
                      isEN ? "Additional notes" : "กรอกหมายเหตุเพิ่มเติม"
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* footer */}
          <div className="flex justify-end">
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
