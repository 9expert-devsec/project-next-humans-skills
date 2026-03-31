"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function clean(x) {
  return String(x || "");
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

const EMPTY_FORM = {
  ref_no: "",
  course_code: "",
  courseSlug: "",
  locale: "th",

  trainee_count: 1,
  training_location: "",
  month_interest: "",
  year_interest: "",

  first_name: "",
  last_name: "",
  position: "",
  department: "",
  contact_phone: "",
  email: "",

  company: "",
  branch: "สำนักงานใหญ่",

  source_channel: "",
  source_other: "",

  tax_id: "",
  company_phone: "",
  receipt_address: "",
  province: "",
  district: "",
  subdistrict: "",
  postcode: "",

  note: "",
  status: "new",
  source: "web",
};

function SectionCard({ title, desc, children, icon: Icon }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Icon className="h-5 w-5 text-white/75" />
        </div>
        <div>
          <div className="text-lg font-bold text-white">{title}</div>
          {desc ? (
            <div className="mt-1 text-sm text-white/45">{desc}</div>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-white/70">{label}</div>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cx(
        "h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25",
        props.className,
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={cx(
        "h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white outline-none transition focus:border-white/25",
        props.className,
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25",
        props.className,
      )}
    />
  );
}

export default function RegistrationEditClient({
  locale = "th",
  adminKey = "",
  id,
}) {
  const router = useRouter();
  const baseAdmin = `/${locale}/${adminKey}/admin`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [meta, setMeta] = useState({ createdAt: "", updatedAt: "" });

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Load failed");

      const item = data.item || {};
      setForm({
        ...EMPTY_FORM,
        ...item,
        trainee_count: Number(item?.trainee_count || 1),
      });
      setMeta({
        createdAt: item?.createdAt || "",
        updatedAt: item?.updatedAt || "",
      });
    } catch (e) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setErr("");

    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Save failed");

      const item = data.item || {};
      setForm({
        ...EMPTY_FORM,
        ...item,
        trainee_count: Number(item?.trainee_count || 1),
      });
      setMeta({
        createdAt: item?.createdAt || "",
        updatedAt: item?.updatedAt || "",
      });

      alert("บันทึกข้อมูลเรียบร้อย");
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (deleting) return;
    if (!confirm("ยืนยันการลบรายการนี้ใช่ไหม?")) return;

    setDeleting(true);
    setErr("");

    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Delete failed");

      router.push(`${baseAdmin}/registrations`);
    } catch (e) {
      setErr(e?.message || "Delete failed");
      setDeleting(false);
    }
  }

  const fullName = useMemo(() => {
    return `${clean(form.first_name)} ${clean(form.last_name)}`.trim() || "-";
  }, [form.first_name, form.last_name]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Registration detail
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              {loading ? "Loading..." : fullName}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/55">
              <span>
                Ref:{" "}
                <span className="font-semibold text-white/80">
                  {form.ref_no || "-"}
                </span>
              </span>
              <span>•</span>
              <span>
                Status:{" "}
                <span className="font-semibold text-white/80">
                  {form.status || "-"}
                </span>
              </span>
              <span>•</span>
              <span>
                Created:{" "}
                <span className="font-semibold text-white/80">
                  {fmtDate(meta.createdAt)}
                </span>
              </span>
              <span>•</span>
              <span>
                Updated:{" "}
                <span className="font-semibold text-white/80">
                  {fmtDate(meta.updatedAt)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`${baseAdmin}/registrations`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>

            <button
              type="submit"
              form="registration-edit-form"
              disabled={saving || loading}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition",
                saving || loading
                  ? "border border-white/10 bg-white/[0.03] text-white/30"
                  : "bg-white text-slate-950 hover:bg-white/90",
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || loading}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition",
                deleting || loading
                  ? "border border-rose-400/10 bg-rose-500/5 text-rose-200/40"
                  : "bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
              )}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </section>

      {err ? (
        <section className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {err}
        </section>
      ) : null}

      <form id="registration-edit-form" onSubmit={onSave} className="space-y-6">
        <SectionCard
          icon={FileText}
          title="Registration Info"
          desc="ข้อมูลหลักของรายการลงทะเบียน"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Ref No">
              <Input
                value={form.ref_no}
                onChange={(e) => setField("ref_no", e.target.value)}
                placeholder="REF..."
              />
            </Field>

            <Field label="Course Code">
              <Input
                value={form.course_code}
                onChange={(e) => setField("course_code", e.target.value)}
                placeholder="COURSECODE"
              />
            </Field>

            <Field label="Course Slug">
              <Input
                value={form.courseSlug}
                onChange={(e) => setField("courseSlug", e.target.value)}
                placeholder="course-slug"
              />
            </Field>

            <Field label="Locale">
              <Select
                value={form.locale}
                onChange={(e) => setField("locale", e.target.value)}
              >
                <option value="th">th</option>
                <option value="en">en</option>
              </Select>
            </Field>

            <Field label="Trainee Count">
              <Input
                type="number"
                min={1}
                value={form.trainee_count}
                onChange={(e) => setField("trainee_count", e.target.value)}
              />
            </Field>

            <Field label="Training Location">
              <Input
                value={form.training_location}
                onChange={(e) => setField("training_location", e.target.value)}
                placeholder="Bangkok / Online / In-house"
              />
            </Field>

            <Field label="Month Interest">
              <Input
                value={form.month_interest}
                onChange={(e) => setField("month_interest", e.target.value)}
                placeholder="March"
              />
            </Field>

            <Field label="Year Interest">
              <Input
                value={form.year_interest}
                onChange={(e) => setField("year_interest", e.target.value)}
                placeholder="2026"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={UserRound}
          title="Contact Person"
          desc="ข้อมูลผู้ประสานงานและช่องทางติดต่อ"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="First Name">
              <Input
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
              />
            </Field>

            <Field label="Last Name">
              <Input
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
              />
            </Field>

            <Field label="Position">
              <Input
                value={form.position}
                onChange={(e) => setField("position", e.target.value)}
              />
            </Field>

            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
              />
            </Field>

            <Field label="Phone">
              <Input
                value={form.contact_phone}
                onChange={(e) => setField("contact_phone", e.target.value)}
                placeholder="0812345678"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={FileText}
          title="Company & Tax"
          desc="ข้อมูลบริษัทและใบกำกับภาษี"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </Field>

            <Field label="Branch">
              <Input
                value={form.branch}
                onChange={(e) => setField("branch", e.target.value)}
              />
            </Field>

            <Field label="Tax ID">
              <Input
                value={form.tax_id}
                onChange={(e) => setField("tax_id", e.target.value)}
              />
            </Field>

            <Field label="Company Phone">
              <Input
                value={form.company_phone}
                onChange={(e) => setField("company_phone", e.target.value)}
              />
            </Field>

            <Field label="Province">
              <Input
                value={form.province}
                onChange={(e) => setField("province", e.target.value)}
              />
            </Field>

            <Field label="District">
              <Input
                value={form.district}
                onChange={(e) => setField("district", e.target.value)}
              />
            </Field>

            <Field label="Subdistrict">
              <Input
                value={form.subdistrict}
                onChange={(e) => setField("subdistrict", e.target.value)}
              />
            </Field>

            <Field label="Postcode">
              <Input
                value={form.postcode}
                onChange={(e) => setField("postcode", e.target.value)}
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Receipt Address">
                <Textarea
                  value={form.receipt_address}
                  onChange={(e) => setField("receipt_address", e.target.value)}
                  className="min-h-[120px]"
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Sparkles}
          title="Marketing & Status"
          desc="ช่องทางที่มาและสถานะของรายการ"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Source Channel">
              <Select
                value={form.source_channel}
                onChange={(e) => setField("source_channel", e.target.value)}
              >
                <option value="">-</option>
                <option value="Bitkub Academy">Bitkub Academy</option>
                <option value="9Expert Training">9Expert Training</option>
                <option value="Key Solutions Training">
                  Key Solutions Training
                </option>
                <option value="Other">Other</option>
              </Select>
            </Field>

            <Field label="Source Other">
              <Input
                value={form.source_other}
                onChange={(e) => setField("source_other", e.target.value)}
              />
            </Field>

            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="quoted">quoted</option>
                <option value="done">done</option>
                <option value="cancelled">cancelled</option>
              </Select>
            </Field>

            <Field label="Source">
              <Input
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
                placeholder="web"
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Note">
                <Textarea
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                  className="min-h-[120px]"
                />
              </Field>
            </div>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
