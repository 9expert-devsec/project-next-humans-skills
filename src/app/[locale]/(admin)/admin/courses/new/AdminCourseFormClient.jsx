// src/components/admin/courses/AdminCourseFormClient.jsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CurriculumBuilder from "./CurriculumBuilder";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function toLines(text) {
  return String(text || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}
function linesToText(arr) {
  return Array.isArray(arr) ? arr.join("\n") : "";
}

const PARTNERS = [
  { key: "bitkub", label: "Bitkub" },
  { key: "9expert", label: "9Expert" },
  { key: "key", label: "Key" },
];

const LEVELS = [
  { key: "executive", label: "Executive" },
  { key: "middle", label: "Middle Management" },
  { key: "workforce", label: "Workforce" },
  { key: "citizen", label: "Citizen Developer" },
  { key: "general", label: "General" },
];

export default function AdminCourseFormClient({
  mode = "create",
  locale = "th",
  initial,
}) {
  const [tab, setTab] = useState("basic"); // basic | content | curriculum | executive | publish
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState(() => {
    const it = initial || {};
    return {
      id: it?._id,
      slug: it?.slug || "",
      title_th: it?.title_th || "",
      title_en: it?.title_en || "",
      short_description: it?.short_description || "",
      level: it?.level || "general",
      duration_days: it?.duration_days || 1,
      status: it?.status || "draft",
      isActive: typeof it?.isActive === "boolean" ? it.isActive : true,
      cover_image: it?.cover_image || "",
      tagsText: Array.isArray(it?.tags) ? it.tags.join(", ") : "",
      partners: Array.isArray(it?.partners) ? it.partners : [],

      content: {
        rationale: it?.content?.rationale || "",
        objectivesText: linesToText(it?.content?.objectives),
        targetAudienceText: linesToText(it?.content?.target_audience),
        benefitsText: linesToText(it?.content?.benefits),
      },

      curriculum: Array.isArray(it?.curriculum) ? it.curriculum : [],

      executive_summary: it?.executive_summary || "",
      highlightText: linesToText(it?.highlight_modules),
      takeawaysText: linesToText(it?.key_takeaways),

      business: {
        price_amount: it?.business?.price_amount || 0,
        price_currency: it?.business?.price_currency || "THB",
        vat_type: it?.business?.vat_type || "",
      },
    };
  });

  const payload = useMemo(() => {
    const tags = String(form.tagsText || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    return {
      id: form.id,
      slug: form.slug,
      title_th: form.title_th,
      title_en: form.title_en,
      short_description: form.short_description,
      level: form.level,
      duration_days: Number(form.duration_days || 1),
      status: form.status,
      isActive: !!form.isActive,
      cover_image: form.cover_image,
      tags,
      partners: form.partners,
      content: {
        rationale: form.content.rationale,
        objectives: toLines(form.content.objectivesText),
        target_audience: toLines(form.content.targetAudienceText),
        benefits: toLines(form.content.benefitsText),
      },
      curriculum: form.curriculum,
      executive_summary: form.executive_summary,
      highlight_modules: toLines(form.highlightText),
      key_takeaways: toLines(form.takeawaysText),
      business: {
        price_amount: Number(form.business.price_amount || 0),
        price_currency: form.business.price_currency || "THB",
        vat_type: form.business.vat_type || "",
      },
    };
  }, [form]);

  function togglePartner(k) {
    setForm((s) => {
      const has = s.partners.includes(k);
      return {
        ...s,
        partners: has ? s.partners.filter((x) => x !== k) : [...s.partners, k],
      };
    });
  }

  async function save() {
    setErr("");
    if (!form.title_th.trim()) {
      setTab("basic");
      setErr("กรุณากรอก Title (TH)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed");

      // ไปหน้า edit ต่อ หรือกลับ list
      const item = data.item;
      location.href = `/${locale}/admin/courses`;
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  const TabBtn = ({ k, label }) => (
    <button
      type="button"
      onClick={() => setTab(k)}
      className={cx(
        "rounded-full px-3 py-2 text-xs font-extrabold ring-1",
        tab === k
          ? "bg-white/10 text-white ring-white/25"
          : "bg-transparent text-white/60 ring-white/10 hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {mode === "create" ? "Create Course" : "Edit Course"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            กรอกข้อมูลคอร์สให้ครบ (Basic → Content → Curriculum → Executive →
            Publish)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/admin/courses`}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/10"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white/90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        <TabBtn k="basic" label="1) Basic" />
        <TabBtn k="content" label="2) Content" />
        <TabBtn k="curriculum" label="3) Curriculum" />
        <TabBtn k="executive" label="4) Executive" />
        <TabBtn k="publish" label="5) Publish" />
      </div>

      {err ? (
        <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">
          {err}
        </div>
      ) : null}

      {/* panel */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        {tab === "basic" ? (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title (TH)">
                <Input
                  value={form.title_th}
                  onChange={(v) => setForm((s) => ({ ...s, title_th: v }))}
                />
              </Field>
              <Field label="Title (EN)">
                <Input
                  value={form.title_en}
                  onChange={(v) => setForm((s) => ({ ...s, title_en: v }))}
                />
              </Field>
            </div>

            <Field label="Short Description (ใช้โชว์หน้า Card/Listing)">
              <TextArea
                rows={3}
                value={form.short_description}
                onChange={(v) =>
                  setForm((s) => ({ ...s, short_description: v }))
                }
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Level">
                <Select
                  value={form.level}
                  onChange={(v) => setForm((s) => ({ ...s, level: v }))}
                  options={LEVELS}
                />
              </Field>
              <Field label="Duration (days)">
                <Input
                  type="number"
                  value={form.duration_days}
                  onChange={(v) => setForm((s) => ({ ...s, duration_days: v }))}
                />
              </Field>
              <Field label="Cover Image URL">
                <Input
                  value={form.cover_image}
                  onChange={(v) => setForm((s) => ({ ...s, cover_image: v }))}
                />
              </Field>
            </div>

            <Field label="Partners">
              <div className="flex flex-wrap gap-2">
                {PARTNERS.map((p) => {
                  const active = form.partners.includes(p.key);
                  return (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => togglePartner(p.key)}
                      className={cx(
                        "rounded-full px-3 py-2 text-xs font-extrabold ring-1",
                        active
                          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                          : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Tags (คั่นด้วย ,)">
              <Input
                value={form.tagsText}
                onChange={(v) => setForm((s) => ({ ...s, tagsText: v }))}
              />
            </Field>
          </div>
        ) : null}

        {tab === "content" ? (
          <div className="grid gap-4">
            <Field label="หลักการและเหตุผล (Rationale)">
              <TextArea
                rows={6}
                value={form.content.rationale}
                onChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    content: { ...s.content, rationale: v },
                  }))
                }
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="วัตถุประสงค์ (Objectives) — บรรทัดละ 1 ข้อ">
                <TextArea
                  rows={8}
                  value={form.content.objectivesText}
                  onChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      content: { ...s.content, objectivesText: v },
                    }))
                  }
                />
              </Field>
              <Field label="กลุ่มเป้าหมาย (Target Audience) — บรรทัดละ 1 ข้อ">
                <TextArea
                  rows={8}
                  value={form.content.targetAudienceText}
                  onChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      content: { ...s.content, targetAudienceText: v },
                    }))
                  }
                />
              </Field>
            </div>

            <Field label="ประโยชน์ที่จะได้รับ (Benefits) — บรรทัดละ 1 ข้อ">
              <TextArea
                rows={8}
                value={form.content.benefitsText}
                onChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    content: { ...s.content, benefitsText: v },
                  }))
                }
              />
            </Field>
          </div>
        ) : null}

        {tab === "curriculum" ? (
          <CurriculumBuilder
            value={form.curriculum}
            onChange={(next) => setForm((s) => ({ ...s, curriculum: next }))}
            partners={PARTNERS.map((x) => x.key)}
          />
        ) : null}

        {tab === "executive" ? (
          <div className="grid gap-4">
            <Field label="Executive Summary">
              <TextArea
                rows={7}
                value={form.executive_summary}
                onChange={(v) =>
                  setForm((s) => ({ ...s, executive_summary: v }))
                }
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Highlight Modules — บรรทัดละ 1 ข้อ">
                <TextArea
                  rows={8}
                  value={form.highlightText}
                  onChange={(v) => setForm((s) => ({ ...s, highlightText: v }))}
                />
              </Field>
              <Field label="Key Takeaways — บรรทัดละ 1 ข้อ">
                <TextArea
                  rows={8}
                  value={form.takeawaysText}
                  onChange={(v) => setForm((s) => ({ ...s, takeawaysText: v }))}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {tab === "publish" ? (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(v) => setForm((s) => ({ ...s, status: v }))}
                  options={[
                    { key: "draft", label: "Draft" },
                    { key: "published", label: "Published" },
                    { key: "archived", label: "Archived" },
                  ]}
                />
              </Field>
              <Field label="Active">
                <Select
                  value={form.isActive ? "1" : "0"}
                  onChange={(v) =>
                    setForm((s) => ({ ...s, isActive: v === "1" }))
                  }
                  options={[
                    { key: "1", label: "Active" },
                    { key: "0", label: "Inactive" },
                  ]}
                />
              </Field>
              <Field label="VAT Type">
                <Select
                  value={form.business.vat_type || ""}
                  onChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      business: { ...s.business, vat_type: v },
                    }))
                  }
                  options={[
                    { key: "", label: "-" },
                    { key: "include", label: "Include" },
                    { key: "exclude", label: "Exclude" },
                  ]}
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Price Amount">
                <Input
                  type="number"
                  value={form.business.price_amount}
                  onChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      business: { ...s.business, price_amount: v },
                    }))
                  }
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={form.business.price_currency}
                  onChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      business: { ...s.business, price_currency: v },
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-2 text-xs font-extrabold text-white/80">{label}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
    />
  );
}

function TextArea({ value, onChange, rows = 5 }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key} className="bg-slate-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}
