// src/components/admin/courses/CourseForm.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CurriculumBuilder from "@/components/admin/courses/CurriculumBuilder";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function arrTextToList(text) {
  return String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToArrText(arr) {
  return Array.isArray(arr) ? arr.join("\n") : "";
}

function pickInitial(x) {
  const v = x && typeof x === "object" ? x : {}; // ✅ กัน null
  return {
    slug: v.slug || "",
    title_th: v.title_th || "",
    title_en: v.title_en || "",
    short_description: v.short_description || "",

    level: v.level || "general",
    duration_days: Number(v.duration_days || 1),
    status: v.status || "draft",
    isActive: typeof v.isActive === "boolean" ? v.isActive : true,

    cover_image: v.cover_image || "",

    tagsText: listToArrText(v.tags),
    partners: Array.isArray(v.partners) ? v.partners : [],

    content: {
      rationale: v.content?.rationale || "",
      objectivesText: listToArrText(v.content?.objectives),
      targetAudienceText: listToArrText(v.content?.target_audience),
      benefitsText: listToArrText(v.content?.benefits),
    },

    curriculum: Array.isArray(v.curriculum) ? v.curriculum : [],
    executive_summary: v.executive_summary || "",
    highlightModulesText: listToArrText(v.highlight_modules),
    keyTakeawaysText: listToArrText(v.key_takeaways),

    business: {
      price_amount: Number(v.business?.price_amount || 0),
      price_currency: v.business?.price_currency || "THB",
      vat_type: v.business?.vat_type || "",
      certificate_template: v.business?.certificate_template || "",
    },
  };
}

export default function CourseForm({
  mode = "edit", // create | edit
  initialValue,
  saving = false,
  onSubmit,
  onReload,
}) {
  const [form, setForm] = useState(() => pickInitial(initialValue || {}));
  useEffect(() => {
    setForm(pickInitial(initialValue || {}));
  }, [initialValue]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverErr, setCoverErr] = useState("");

  async function uploadCover(file) {
    setCoverErr("");
    if (!file) return;

    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "next-skills/courses");

      const res = await fetch("/api/admin/uploads/course-cover", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      // ✅ เขียนกลับ cover_image
      setField("cover_image", data.url);
    } catch (e) {
      setCoverErr(e?.message || "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  useEffect(() => {
    setForm(pickInitial(initialValue || {})); // ✅ กัน null
  }, [initialValue]);

  function setField(path, value) {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        cur[k] = { ...(cur[k] || {}) };
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  const partnersOptions = useMemo(() => ["bitkub", "9expert", "key"], []);

  function buildPayload() {
    const payload = {
      slug: String(form.slug || "").trim(),
      title_th: String(form.title_th || "").trim(),
      title_en: String(form.title_en || "").trim(),
      short_description: String(form.short_description || "").trim(),

      level: form.level,
      duration_days: Number(form.duration_days || 1),
      status: form.status,
      isActive: Boolean(form.isActive),

      cover_image: String(form.cover_image || "").trim(),

      tags: arrTextToList(form.tagsText),
      partners: Array.isArray(form.partners) ? form.partners : [],

      content: {
        rationale: String(form.content?.rationale || "").trim(),
        objectives: arrTextToList(form.content?.objectivesText),
        target_audience: arrTextToList(form.content?.targetAudienceText),
        benefits: arrTextToList(form.content?.benefitsText),
      },

      curriculum: Array.isArray(form.curriculum) ? form.curriculum : [],

      executive_summary: String(form.executive_summary || "").trim(),
      highlight_modules: arrTextToList(form.highlightModulesText),
      key_takeaways: arrTextToList(form.keyTakeawaysText),

      business: {
        price_amount: Number(form.business?.price_amount || 0),
        price_currency:
          String(form.business?.price_currency || "THB").trim() || "THB",
        vat_type: form.business?.vat_type || "",
        certificate_template:
          String(form.business?.certificate_template || "").trim() || "",
      },
    };

    // edit mode: ถ้า slug ว่าง ปล่อยให้ CourseEditClient ลบให้แล้วก็ได้
    return payload;
  }

  function togglePartner(p) {
    const current = Array.isArray(form.partners) ? form.partners : [];
    if (current.includes(p)) {
      setField(
        "partners",
        current.filter((x) => x !== p)
      );
    } else {
      setField("partners", [...current, p]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const payload = buildPayload();
    await onSubmit?.(payload);
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      {/* Core */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-extrabold text-white">ข้อมูลหลัก</div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Title (TH) *
            </div>
            <input
              value={form.title_th}
              onChange={(e) => setField("title_th", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Title (EN)
            </div>
            <input
              value={form.title_en}
              onChange={(e) => setField("title_en", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Slug
            </div>
            <input
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              placeholder={
                mode === "edit" ? "(เว้นว่างเพื่อคงเดิม)" : "auto จาก title_th"
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Cover image
            </div>

            <div className="grid gap-2">
              <input
                value={form.cover_image}
                onChange={(e) => setField("cover_image", e.target.value)}
                placeholder="หรือวาง URL เอง https://..."
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
              />

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover || saving}
                  onChange={(e) => uploadCover(e.target.files?.[0])}
                  className="block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-white hover:file:bg-white/15"
                />

                {uploadingCover ? (
                  <div className="text-xs font-bold text-white/60">
                    Uploading...
                  </div>
                ) : null}
              </div>

              {coverErr ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200">
                  {coverErr}
                </div>
              ) : null}

              {form.cover_image ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.cover_image}
                    alt="cover"
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-extrabold text-white/70">
            Short description
          </div>
          <textarea
            rows={3}
            value={form.short_description}
            onChange={(e) => setField("short_description", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Level
            </div>
            <select
              value={form.level}
              onChange={(e) => setField("level", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            >
              {["general", "executive", "middle", "workforce", "citizen"].map(
                (v) => (
                  <option key={v} value={v} className="bg-slate-900">
                    {v}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Duration (days)
            </div>
            <input
              type="number"
              min={1}
              value={form.duration_days}
              onChange={(e) => setField("duration_days", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Status
            </div>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            >
              {["draft", "published", "archived"].map((v) => (
                <option key={v} value={v} className="bg-slate-900">
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/90">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Tags (บรรทัดละ 1)
            </div>
            <textarea
              rows={4}
              value={form.tagsText}
              onChange={(e) => setField("tagsText", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Partners
            </div>
            <div className="flex flex-wrap gap-2">
              {partnersOptions.map((p) => {
                const active = (form.partners || []).includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePartner(p)}
                    className={cx(
                      "rounded-full px-4 py-2 text-xs font-extrabold ring-1",
                      active
                        ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                        : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-extrabold text-white">Content</div>

        <div>
          <div className="mb-2 text-xs font-extrabold text-white/70">
            หลักการและเหตุผล (Rationale)
          </div>
          <textarea
            rows={5}
            value={form.content.rationale}
            onChange={(e) => setField("content.rationale", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              วัตถุประสงค์ (บรรทัดละ 1)
            </div>
            <textarea
              rows={6}
              value={form.content.objectivesText}
              onChange={(e) =>
                setField("content.objectivesText", e.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              กลุ่มเป้าหมาย (บรรทัดละ 1)
            </div>
            <textarea
              rows={6}
              value={form.content.targetAudienceText}
              onChange={(e) =>
                setField("content.targetAudienceText", e.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              ประโยชน์ที่จะได้รับ (บรรทัดละ 1)
            </div>
            <textarea
              rows={6}
              value={form.content.benefitsText}
              onChange={(e) => setField("content.benefitsText", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <CurriculumBuilder
          value={form.curriculum}
          partners={partnersOptions}
          onChange={(next) => setField("curriculum", next)}
        />
      </div>

      {/* Executive / Marketing */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-extrabold text-white">
          Executive / Marketing
        </div>

        <div>
          <div className="mb-2 text-xs font-extrabold text-white/70">
            Executive summary
          </div>
          <textarea
            rows={5}
            value={form.executive_summary}
            onChange={(e) => setField("executive_summary", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Highlight modules (บรรทัดละ 1)
            </div>
            <textarea
              rows={6}
              value={form.highlightModulesText}
              onChange={(e) => setField("highlightModulesText", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Key takeaways (บรรทัดละ 1)
            </div>
            <textarea
              rows={6}
              value={form.keyTakeawaysText}
              onChange={(e) => setField("keyTakeawaysText", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
        </div>
      </div>

      {/* Business */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-extrabold text-white">Business</div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Price amount
            </div>
            <input
              type="number"
              min={0}
              value={form.business.price_amount}
              onChange={(e) =>
                setField("business.price_amount", e.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">
              Currency
            </div>
            <input
              value={form.business.price_currency}
              onChange={(e) =>
                setField("business.price_currency", e.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold text-white/70">VAT</div>
            <select
              value={form.business.vat_type}
              onChange={(e) => setField("business.vat_type", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            >
              <option value="" className="bg-slate-900">
                -
              </option>
              <option value="include" className="bg-slate-900">
                include
              </option>
              <option value="exclude" className="bg-slate-900">
                exclude
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onReload ? (
          <button
            type="button"
            onClick={onReload}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10 disabled:opacity-60"
          >
            Reload
          </button>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-white/90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
