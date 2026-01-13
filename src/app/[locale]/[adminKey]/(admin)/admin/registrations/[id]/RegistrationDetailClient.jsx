// src/app/[locale]/[adminKey]/(admin)/admin/registrations/[id]/RegistrationsDetailClient.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

const STATUS_OPTIONS = [
  { value: "new", label: "new" },
  { value: "contacted", label: "contacted" },
  { value: "done", label: "done" },
  { value: "cancelled", label: "cancelled" },
];

const SOURCE_LABEL = {
  "Bitkub Academy": "Bitkub Academy",
  "9Expert Training": "9Expert Training",
  "Key Solutions Training": "Key Solutions Training",
  other: "Other",
};

function renderSource(item) {
  const ch = String(item?.source_channel || "").trim();
  const other = String(item?.source_other || "").trim();
  if (!ch) return "-";
  if (ch === "other") return other ? `Other: ${other}` : "Other";
  return SOURCE_LABEL[ch] || ch;
}

function Row({ k, v }) {
  return (
    <div className="grid grid-cols-12 gap-3 py-2">
      <div className="col-span-4 text-sm font-bold text-white/60">{k}</div>
      <div className="col-span-8 text-sm text-white/90 break-words">{v}</div>
    </div>
  );
}

export default function RegistrationDetailClient({ locale = "th", id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("new");
  const [internalNote, setInternalNote] = useState("");

  const refNo = useMemo(() => String(id || ""), [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "load failed");
      setItem(data.item);
      setStatus(data.item?.status || "new");
      setInternalNote(data.item?.internal_note || "");
    } catch (e) {
      console.error(e);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function savePatch(patch) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "save failed");
      setItem(data.item);
      setStatus(data.item?.status || "new");
      setInternalNote(data.item?.internal_note || "");
      return true;
    } catch (e) {
      console.error(e);
      alert("Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onSave() {
    await savePatch({ status, internal_note: internalNote });
  }

  async function onResend() {
    if (!confirm("ส่งอีเมลยืนยันซ้ำให้ผู้ลงทะเบียน และ BCC ให้แอดมิน ใช่ไหม?"))
      return;
    setResending(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(id)}/resend-email`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "resend failed");
      alert("Resent email ok");
    } catch (e) {
      console.error(e);
      alert("Resend failed");
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-white">
        <div className="text-2xl font-extrabold">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-white">
        <div className="text-2xl font-extrabold">Not found</div>
        <button
          onClick={() =>
            router.push(`/${locale}/k8Pz7M2xYn5R0wLq/admin/registrations`)
          }
          className="mt-5 h-10 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-900"
        >
          Back to list
        </button>
      </div>
    );
  }

  const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        {/* header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white">
              Registration Detail
            </div>
            <div className="mt-1 text-sm text-white/60">
              Ref: <span className="font-mono">{item.ref_no}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                router.push(`/${locale}/k8Pz7M2xYn5R0wLq/admin/registrations`)
              }
              className="h-10 rounded-xl bg-white/10 px-4 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              Back
            </button>

            <button
              onClick={onResend}
              disabled={resending}
              className={cx(
                "h-10 rounded-xl px-4 text-sm font-extrabold ring-1",
                resending
                  ? "bg-white/5 text-white/40 ring-white/10"
                  : "bg-white/10 text-white ring-white/10 hover:bg-white/15"
              )}
            >
              {resending ? "Sending..." : "Resend Email"}
            </button>

            <button
              onClick={onSave}
              disabled={saving}
              className={cx(
                "h-10 rounded-xl px-4 text-sm font-extrabold",
                saving
                  ? "bg-white/70 text-slate-900"
                  : "bg-white text-slate-900 hover:bg-white/90"
              )}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* left */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-black/10 p-5">
            <div className="text-lg font-extrabold text-white">Summary</div>
            <div className="mt-4 divide-y divide-white/10">
              <Row k="Created" v={fmtDate(item.createdAt)} />
              <Row k="Locale" v={item.locale || "-"} />
              <Row k="CourseSlug" v={item.courseSlug || "-"} />
              <Row k="Source channel" v={renderSource(item)} /> {/* ✅ NEW */}
              <Row k="Name" v={fullName || "-"} />
              <Row k="Email" v={item.email || "-"} />
              <Row k="Phone" v={item.contact_phone || "-"} />
              <Row k="Company" v={item.company || "-"} />
              <Row k="Branch" v={item.branch || "-"} /> {/* ✅ NEW */}
              <Row k="Tax ID" v={item.tax_id || "-"} />
            </div>

            <div className="mt-6 text-lg font-extrabold text-white">
              Training request
            </div>
            <div className="mt-4 divide-y divide-white/10">
              <Row k="Trainee count" v={String(item.trainee_count || 1)} />
              <Row k="Interested month" v={item.month_interest || "-"} />
              <Row k="Interested year" v={item.year_interest || "-"} />
              <Row k="Training location" v={item.training_location || "-"} />
            </div>

            <div className="mt-6 text-lg font-extrabold text-white">
              Receipt address
            </div>
            <div className="mt-4 divide-y divide-white/10">
              <Row k="Receipt address" v={item.receipt_address || "-"} />
              <Row
                k="Province/District/Subdistrict"
                v={
                  [
                    item.province,
                    item.district,
                    item.subdistrict,
                    item.postcode ? `(${item.postcode})` : "",
                  ]
                    .filter(Boolean)
                    .join(" • ") || "-"
                }
              />
              <Row k="Company phone" v={item.company_phone || "-"} />
            </div>

            <div className="mt-6 text-lg font-extrabold text-white">
              User note
            </div>
            <div className="mt-2 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/85">
              {item.note ? item.note : <span className="text-white/40">-</span>}
            </div>
          </div>

          {/* right */}
          <div className="lg:col-span-5 grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <div className="text-lg font-extrabold text-white">Status</div>
              <div className="mt-3 text-sm text-white/60">
                เปลี่ยนสถานะแล้วกด Save
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={cx(
                  "mt-4 h-11 w-full rounded-2xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <div className="text-lg font-extrabold text-white">
                Internal note
              </div>
              <div className="mt-2 text-sm text-white/60">
                โน้ตภายในสำหรับทีม (ไม่ส่งให้ลูกค้า)
              </div>

              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={6}
                className={cx(
                  "mt-4 w-full resize-y rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white outline-none",
                  "placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
                placeholder="เช่น โทรแล้ว / รอเอกสาร / นัดวัน follow-up..."
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <div className="text-lg font-extrabold text-white">Meta</div>
              <div className="mt-4 divide-y divide-white/10">
                <Row k="IP" v={item.ip || "-"} />
                <Row k="User-Agent" v={item.userAgent || "-"} />
                <Row k="Updated" v={fmtDate(item.updatedAt)} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/40">
          * ปุ่ม Resend จะใช้ Postmark Template และ BCC ไปที่
          ADMIN_NOTIFY_EMAILS
        </div>
      </div>
    </div>
  );
}
