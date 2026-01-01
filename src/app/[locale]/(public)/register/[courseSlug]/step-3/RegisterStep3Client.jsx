"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepBar from "@/components/StepBar";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

/** ✅ key กลางเดียวกับ step-1/step-2 */
function DraftKey(courseSlug) {
  return `nx-register-draft:${String(courseSlug || "").trim()}`;
}
function ResultKey(courseSlug) {
  return `nx-register-result:${String(courseSlug || "").trim()}`;
}

function sourceLabel(locale, channel) {
  const isEN = locale === "en";
  const c = String(channel || "").trim();

  const mapTH = {
    bitkub: "Bitkub Academy",
    "9expert": "9Expert Training",
    key: "Key Solutions Training",
    other: "อื่นๆ (Other)",
  };

  const mapEN = {
    bitkub: "Bitkub Academy",
    "9expert": "9Expert Training",
    key: "Key Solutions Training",
    other: "Other",
  };

  return (isEN ? mapEN : mapTH)[c] || "-";
}

function formatSource(locale, channel, otherText) {
  const c = String(channel || "").trim();
  if (!c) return "-";
  const base = sourceLabel(locale, c);
  if (c !== "other") return base;
  const t = String(otherText || "").trim();
  return t ? `${base}: ${t}` : base;
}


function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/10 p-5 md:p-6">
      <div className="text-lg font-extrabold text-white">{title}</div>
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

export default function RegisterStep3Client({ locale = "th", courseSlug }) {
  const router = useRouter();
  const isEN = locale === "en";

  const [course, setCourse] = useState(null);

  // local cache (fallback)
  const [draft, setDraft] = useState(null);
  const [result, setResult] = useState(null);

  // server truth
  const [serverData, setServerData] = useState(null);
  const [serverErr, setServerErr] = useState("");

  // guard
  useEffect(() => {
    if (!courseSlug) router.replace(`/${locale}`);
  }, [courseSlug, locale, router]);

  // fetch course (เพื่อ header)
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

  // ✅ load draft + result from sessionStorage
  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem(DraftKey(courseSlug));
      const rawResult = sessionStorage.getItem(ResultKey(courseSlug));

      const d = rawDraft ? JSON.parse(rawDraft) : null;
      const r = rawResult ? JSON.parse(rawResult) : null;

      setDraft(d && typeof d === "object" ? d : null);
      setResult(r && typeof r === "object" ? r : null);
    } catch {
      setDraft(null);
      setResult(null);
    }
  }, [courseSlug]);

  // fetch registration from DB (if have registrationId)
  useEffect(() => {
    const id = String(result?.registrationId || "").trim();
    if (!id) return;

    let alive = true;
    setServerErr("");
    (async () => {
      try {
        const res = await fetch(`/api/public/registrations/${id}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok || !data?.ok) {
          setServerData(null);
          setServerErr(data?.error || "Failed to load registration");
          return;
        }

        setServerData(data.item || null);
      } catch (e) {
        if (!alive) return;
        setServerData(null);
        setServerErr(e?.message || "Failed to load registration");
      }
    })();

    return () => (alive = false);
  }, [result?.registrationId]);

  // data to display: prefer serverData
  const data = serverData || draft || null;

  const coverUrl = course?.cover_image || "";
  const courseTitle =
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    "";

  /** ✅ ใช้ ref_no ก่อน ถ้าไม่มีค่อย fallback */
  const refNo = String(
    serverData?.ref_no || result?.refNo || result?.registrationId || ""
  ).trim();

  const contactName = useMemo(() => {
    if (!data) return "";
    return [data.first_name, data.last_name]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join(" ");
  }, [data]);

  const locationLine = useMemo(() => {
    if (!data) return "";
    const parts = [
      data.training_location,
      // data.province,
      // data.district,
      // data.subdistrict,
      // data.postcode ? `(${data.postcode})` : "",
    ]
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return parts.join(" • ");
  }, [data]);

  function goCourse() {
    router.push(`/${locale}/courses/${encodeURIComponent(courseSlug)}`);
  }

  function startNew() {
    try {
      sessionStorage.removeItem(DraftKey(courseSlug));
      sessionStorage.removeItem(ResultKey(courseSlug));
    } catch {}
    router.push(`/${locale}/register/${encodeURIComponent(courseSlug)}/step-1`);
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl mt-32 px-4 py-10 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
          <div className="text-2xl font-extrabold">
            {isEN ? "Loading..." : "กำลังโหลด..."}
          </div>
          <div className="mt-2 text-white/60">
            {isEN ? "Preparing success page" : "กำลังเตรียมหน้าสำเร็จ"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl mt-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-7">
        {/* header */}
        {/* <div className="flex gap-2">
            <button
              onClick={goCourse}
              className="h-11 rounded-2xl bg-white/10 px-5 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              {isEN ? "Back to course" : "กลับหน้าคอร์ส"}
            </button>
          </div> */}

        <div className="mt-7">
          <div className="text-4xl font-extrabold text-white text-center">
            {isEN ? "Register Completed" : "ลงทะเบียนเสร็จสิ้น"}
          </div>
          <div className="mt-2 text-sm text-white/60 text-center">
            {isEN
              ? "Your information has been submitted successfully"
              : "ส่งข้อมูลเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็ว"}
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
                {/* {course?.title_en && !isEN ? (
                  <div className="mt-1 text-sm text-white/50">
                    {course.title_en}
                  </div>
                ) : null} */}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          {/* Success */}
          <Section
            title={isEN ? "Success 🎉" : "สำเร็จ 🎉"}
            subtitle={
              isEN
                ? "We have received your registration inquiry."
                : "เราได้รับข้อมูลความสนใจลงทะเบียนเรียบร้อยแล้ว"
            }
          >
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <Item
                  label={isEN ? "Reference No." : "เลขอ้างอิง"}
                  value={
                    refNo || (isEN ? "(not available)" : "(ยังไม่มีเลขอ้างอิง)")
                  }
                  mono
                />
                <div className="mt-3 grid gap-3">
                  <Item
                    label={isEN ? "Contact name" : "ผู้ติดต่อ"}
                    value={contactName || "-"}
                  />
                  <Item
                    label={isEN ? "Email" : "อีเมล"}
                    value={String(data?.email || "").trim() || "-"}
                  />
                </div>
              </div>
              <div className="md:col-span-4 ">
                <div className="h-full rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="text-sm font-extrabold text-emerald-200">
                    {isEN ? "What’s next?" : "ขั้นตอนถัดไป"}
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-white/75">
                    <li>
                      •{" "}
                      {isEN
                        ? "Our team will contact you for confirmation."
                        : "ทีมงานจะติดต่อกลับเพื่อยืนยันรายละเอียด"}
                    </li>
                    <li>
                      •{" "}
                      {isEN
                        ? "You can reference the number below if needed."
                        : "สามารถใช้อ้างอิงเลขด้านล่างเมื่อสอบถามข้อมูล"}
                    </li>
                  </ul>
                </div>

                {serverErr ? (
                  <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
                    <div className="text-sm font-extrabold text-rose-200">
                      {isEN ? "Note" : "หมายเหตุ"}
                    </div>
                    <div className="mt-1 text-sm text-white/75">
                      {isEN
                        ? `Cannot load from database: ${serverErr}`
                        : `ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้: ${serverErr}`}
                      <div className="mt-1 text-xs text-white/50">
                        {isEN
                          ? "Showing local draft as fallback."
                          : "แสดงข้อมูลจาก draft ในเครื่องแทน (ชั่วคราว)"}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

            </div>
          </Section>

          {/* Summary */}
          <Section
            title={isEN ? "Summary" : "สรุปข้อมูลที่ส่ง"}
            subtitle={
              isEN
                ? "Please keep this for your record."
                : "เก็บไว้เป็นหลักฐานการส่งข้อมูล"
            }
          >
            {!data ? (
              <div className="text-sm text-white/70">
                {isEN
                  ? "No data found (maybe cleared by browser)."
                  : "ไม่พบข้อมูล (อาจถูกล้างจากเบราว์เซอร์)"}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <Item
                    label={isEN ? "Trainees" : "จำนวนผู้เข้าอบรม"}
                    value={String(data?.trainee_count || "-")}
                  />
                </div>
                <div className="md:col-span-3">
                  <Item
                    label={isEN ? "Month" : "เดือน"}
                    value={String(data?.month_interest || "").trim() || "-"}
                  />
                </div>
                <div className="md:col-span-3">
                  <Item
                    label={isEN ? "Year" : "ปี"}
                    value={String(data?.year_interest || "").trim() || "-"}
                  />
                </div>
                <div className="md:col-span-3">
                  <Item
                    label={isEN ? "Phone" : "เบอร์โทร"}
                    value={
                      formatThaiPhoneFromDigits(
                        data?.contact_phone || data?.contact_phone_raw
                      ) || "-"
                    }
                    mono
                  />
                </div>

                <div className="md:col-span-12">
                  <Item
                    label={
                      isEN
                        ? "Training location requirement"
                        : "สถานที่อบรมที่ต้องการ"
                    }
                    value={locationLine || "-"}
                  />
                </div>

                <div className="md:col-span-12">
                  <Item
                    label={isEN ? "Company" : "บริษัท"}
                    value={String(data?.company || "").trim() || "-"}
                  />
                </div>

                <div className="md:col-span-12">
                  <Item
                    label={isEN ? "Branch" : "สาขา"} // ✅ เพิ่ม
                    value={String(data?.branch || "").trim() || "-"}
                  />
                </div>

                <div className="md:col-span-12">
                  <Item
                    label={isEN ? "Tax ID" : "เลขประจำตัวผู้เสียภาษี"}
                    value={String(data?.tax_id || "").trim() || "-"}
                    mono
                  />
                </div>

                <div className="md:col-span-12">
                  <Item
                    label={isEN ? "Receipt address" : "ที่อยู่สำหรับออกใบเสร็จ"}
                    value={String(data?.receipt_address || "").trim() || "-"}
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
                        data?.province,
                        data?.district,
                        data?.subdistrict,
                        data?.postcode ? `(${data.postcode})` : "",
                      ]
                        .map((x) => String(x || "").trim())
                        .filter(Boolean)
                        .join(" • ") || "-"
                    }
                  />
                </div>

                <div className="md:col-span-12">
                  <Item
                    label={
                      isEN
                        ? "How did you hear about us?"
                        : "ท่านทราบข้อมูลข่าวสารจากช่องทางใด"
                    }
                    value={formatSource(
                      locale,
                      data?.source_channel,
                      data?.source_other
                    )}
                  />
                </div>

                {String(data?.note || "").trim() ? (
                  <div className="md:col-span-12">
                    <Item
                      label={isEN ? "Note" : "หมายเหตุ"}
                      value={String(data?.note || "").trim()}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </Section>

          {/* actions */}
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

          {/* <div className="text-xs text-white/40">
            {isEN
              ? "This page uses database data when available; otherwise it falls back to local draft."
              : "หน้านี้จะใช้ข้อมูลจากฐานข้อมูลเมื่อดึงได้ หากดึงไม่ได้จะ fallback ไปใช้ draft ในเครื่อง"}
          </div> */}
        </div>
      </div>
    </div>
  );
}
