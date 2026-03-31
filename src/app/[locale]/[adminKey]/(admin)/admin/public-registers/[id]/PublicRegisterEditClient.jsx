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
  Users,
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
  courseSlug: "",
  locale: "th",

  coordinator: {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_raw: "",
  },

  trainee_count: 1,
  coordinator_is_trainee: false,
  no_trainees_yet: false,
  trainees: [],

  tax: {
    type: "personal",
    personal_first_name: "",
    personal_last_name: "",
    company_name: "",
    branch: "สำนักงานใหญ่",
    tax_id: "",
    phone: "",
    phone_raw: "",
    address: "",
    province: "",
    district: "",
    subdistrict: "",
    postcode: "",
  },

  source_channel: "",
  source_other: "",
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

function makeEmptyTrainee() {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_raw: "",
  };
}

export default function PublicRegisterEditClient({
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
  const [meta, setMeta] = useState({
    createdAt: "",
    updatedAt: "",
    courseTitle: "",
    courseDateText: "",
  });

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`/api/admin/public-registrations/${id}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Load failed");

      const item = data.item || {};

      setForm({
        ...EMPTY_FORM,
        ...item,
        trainee_count: Number(item?.trainee_count || 1),
        coordinator: {
          ...EMPTY_FORM.coordinator,
          ...(item?.coordinator || {}),
        },
        tax: {
          ...EMPTY_FORM.tax,
          ...(item?.tax || {}),
        },
        trainees: Array.isArray(item?.trainees)
          ? item.trainees.map((t) => ({
              ...makeEmptyTrainee(),
              ...t,
            }))
          : [],
      });

      setMeta({
        createdAt: item?.createdAt || "",
        updatedAt: item?.updatedAt || "",
        courseTitle:
          item?.courseTitle ||
          item?.course_title ||
          item?.course_title_subject ||
          "",
        courseDateText: item?.courseDateText || item?.course_date_text || "",
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

  function setCoordinatorField(name, value) {
    setForm((prev) => ({
      ...prev,
      coordinator: {
        ...prev.coordinator,
        [name]: value,
      },
    }));
  }

  function setTaxField(name, value) {
    setForm((prev) => ({
      ...prev,
      tax: {
        ...prev.tax,
        [name]: value,
      },
    }));
  }

  function setTraineeField(index, name, value) {
    setForm((prev) => {
      const next = [...(prev.trainees || [])];
      next[index] = {
        ...(next[index] || makeEmptyTrainee()),
        [name]: value,
      };
      return { ...prev, trainees: next };
    });
  }

  function addTrainee() {
    setForm((prev) => ({
      ...prev,
      trainees: [...(prev.trainees || []), makeEmptyTrainee()],
    }));
  }

  function removeTrainee(index) {
    setForm((prev) => ({
      ...prev,
      trainees: (prev.trainees || []).filter((_, i) => i !== index),
    }));
  }

  async function onSave(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setErr("");

    try {
      const res = await fetch(`/api/admin/public-registrations/${id}`, {
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
        coordinator: {
          ...EMPTY_FORM.coordinator,
          ...(item?.coordinator || {}),
        },
        tax: {
          ...EMPTY_FORM.tax,
          ...(item?.tax || {}),
        },
        trainees: Array.isArray(item?.trainees)
          ? item.trainees.map((t) => ({
              ...makeEmptyTrainee(),
              ...t,
            }))
          : [],
      });

      setMeta((prev) => ({
        ...prev,
        createdAt: item?.createdAt || prev.createdAt,
        updatedAt: item?.updatedAt || prev.updatedAt,
      }));

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
      const res = await fetch(`/api/admin/public-registrations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Delete failed");

      router.push(`${baseAdmin}/public-registers`);
    } catch (e) {
      setErr(e?.message || "Delete failed");
      setDeleting(false);
    }
  }

  const coordinatorName = useMemo(() => {
    return (
      `${clean(form.coordinator?.first_name)} ${clean(form.coordinator?.last_name)}`.trim() ||
      "-"
    );
  }, [form.coordinator]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Public register detail
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              {loading ? "Loading..." : coordinatorName}
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
                Course:{" "}
                <span className="font-semibold text-white/80">
                  {meta.courseTitle || form.courseSlug || "-"}
                </span>
              </span>
              <span>•</span>
              <span>
                Date:{" "}
                <span className="font-semibold text-white/80">
                  {meta.courseDateText || "-"}
                </span>
              </span>
              <span>•</span>
              <span>
                Created:{" "}
                <span className="font-semibold text-white/80">
                  {fmtDate(meta.createdAt)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`${baseAdmin}/public-registers`}
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
              form="public-register-edit-form"
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

      <form
        id="public-register-edit-form"
        onSubmit={onSave}
        className="space-y-6"
      >
        <SectionCard
          icon={FileText}
          title="Registration Info"
          desc="ข้อมูลหลักของรายการลงทะเบียน public"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Ref No">
              <Input
                value={form.ref_no}
                onChange={(e) => setField("ref_no", e.target.value)}
              />
            </Field>

            <Field label="Course Slug">
              <Input
                value={form.courseSlug}
                onChange={(e) => setField("courseSlug", e.target.value)}
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

            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="done">done</option>
                <option value="cancelled">cancelled</option>
              </Select>
            </Field>

            <Field label="Source">
              <Input
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
              />
            </Field>

            <div className="xl:col-span-2">
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1727] px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={!!form.coordinator_is_trainee}
                    onChange={(e) =>
                      setField("coordinator_is_trainee", e.target.checked)
                    }
                  />
                  <span>Coordinator is trainee</span>
                </label>

                <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1727] px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={!!form.no_trainees_yet}
                    onChange={(e) =>
                      setField("no_trainees_yet", e.target.checked)
                    }
                  />
                  <span>No trainees yet</span>
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={UserRound}
          title="Coordinator"
          desc="ข้อมูลผู้ประสานงาน"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="First Name">
              <Input
                value={form.coordinator?.first_name || ""}
                onChange={(e) =>
                  setCoordinatorField("first_name", e.target.value)
                }
              />
            </Field>

            <Field label="Last Name">
              <Input
                value={form.coordinator?.last_name || ""}
                onChange={(e) =>
                  setCoordinatorField("last_name", e.target.value)
                }
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={form.coordinator?.email || ""}
                onChange={(e) => setCoordinatorField("email", e.target.value)}
              />
            </Field>

            <Field label="Phone">
              <Input
                value={form.coordinator?.phone || ""}
                onChange={(e) => setCoordinatorField("phone", e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard icon={Users} title="Trainees" desc="รายชื่อผู้เข้าอบรม">
          <div className="space-y-4">
            {(form.trainees || []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/45">
                ยังไม่มีรายชื่อผู้เข้าอบรม
              </div>
            ) : null}

            {(form.trainees || []).map((t, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-white">
                    Trainee #{index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeTrainee(index)}
                    className="rounded-2xl bg-rose-500/15 px-3 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-500/25"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="First Name">
                    <Input
                      value={t?.first_name || ""}
                      onChange={(e) =>
                        setTraineeField(index, "first_name", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Last Name">
                    <Input
                      value={t?.last_name || ""}
                      onChange={(e) =>
                        setTraineeField(index, "last_name", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Email">
                    <Input
                      type="email"
                      value={t?.email || ""}
                      onChange={(e) =>
                        setTraineeField(index, "email", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Phone">
                    <Input
                      value={t?.phone || ""}
                      onChange={(e) =>
                        setTraineeField(index, "phone", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addTrainee}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              + Add trainee
            </button>
          </div>
        </SectionCard>

        <SectionCard
          icon={FileText}
          title="Tax & Billing"
          desc="ข้อมูลออกใบกำกับภาษี"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Tax Type">
              <Select
                value={form.tax?.type || "personal"}
                onChange={(e) => setTaxField("type", e.target.value)}
              >
                <option value="personal">personal</option>
                <option value="company">company</option>
              </Select>
            </Field>

            <Field label="Personal First Name">
              <Input
                value={form.tax?.personal_first_name || ""}
                onChange={(e) =>
                  setTaxField("personal_first_name", e.target.value)
                }
              />
            </Field>

            <Field label="Personal Last Name">
              <Input
                value={form.tax?.personal_last_name || ""}
                onChange={(e) =>
                  setTaxField("personal_last_name", e.target.value)
                }
              />
            </Field>

            <Field label="Company Name">
              <Input
                value={form.tax?.company_name || ""}
                onChange={(e) => setTaxField("company_name", e.target.value)}
              />
            </Field>

            <Field label="Branch">
              <Input
                value={form.tax?.branch || ""}
                onChange={(e) => setTaxField("branch", e.target.value)}
              />
            </Field>

            <Field label="Tax ID">
              <Input
                value={form.tax?.tax_id || ""}
                onChange={(e) => setTaxField("tax_id", e.target.value)}
              />
            </Field>

            <Field label="Phone">
              <Input
                value={form.tax?.phone || ""}
                onChange={(e) => setTaxField("phone", e.target.value)}
              />
            </Field>

            <Field label="Postcode">
              <Input
                value={form.tax?.postcode || ""}
                onChange={(e) => setTaxField("postcode", e.target.value)}
              />
            </Field>

            <Field label="Province">
              <Input
                value={form.tax?.province || ""}
                onChange={(e) => setTaxField("province", e.target.value)}
              />
            </Field>

            <Field label="District">
              <Input
                value={form.tax?.district || ""}
                onChange={(e) => setTaxField("district", e.target.value)}
              />
            </Field>

            <Field label="Subdistrict">
              <Input
                value={form.tax?.subdistrict || ""}
                onChange={(e) => setTaxField("subdistrict", e.target.value)}
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Address">
                <Textarea
                  value={form.tax?.address || ""}
                  onChange={(e) => setTaxField("address", e.target.value)}
                  className="min-h-[120px]"
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Sparkles}
          title="Marketing & Note"
          desc="ช่องทางที่มาและหมายเหตุ"
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
