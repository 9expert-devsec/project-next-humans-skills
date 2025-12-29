"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CourseForm from "@/components/admin/courses/CourseForm";
import AdminTopbar from "@/components/admin/AdminTopbar";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function CourseEditClient({ locale, id }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);

  const backHref = useMemo(() => `/${locale}/k8Pz7M2xYn5R0wLq/admin/courses`, [locale]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Load failed (${res.status})`);
      }
      setItem(data.item || null);
    } catch (e) {
      setErr(e?.message || "Load failed");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values) {
    setErr("");
    setSaving(true);
    try {
      // ถ้า slug ว่าง → ไม่ส่ง (เพื่อ “คง slug เดิม” ตาม API ของคุณ)
      const payload = { ...values };
      if (!String(payload.slug || "").trim()) delete payload.slug;

      const res = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
      setItem(data.item || null);
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("ลบคอร์สนี้แน่ใจนะครับ?")) return;
    setErr("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }
      location.href = backHref;
    } catch (e) {
      setErr(e?.message || "Delete failed");
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div>
      <AdminTopbar
        title="Edit Course"
        subtitle={item?.title_th ? item.title_th : `#${id}`}
        locale={locale}
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">แก้ไขคอร์ส</h1>
            <p className="mt-1 text-sm text-white/60">
              แก้ข้อมูลหลักของคอร์ส และบันทึกด้วยปุ่ม Save
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10"
            >
              ← กลับไปหน้ารวม
            </Link>
            <button
              onClick={onDelete}
              disabled={saving || loading}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-extrabold",
                "border border-rose-500/30 bg-rose-500/15 text-rose-200",
                "hover:bg-rose-500/20 disabled:opacity-60"
              )}
            >
              ลบคอร์ส
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          {loading ? (
            <div className="text-white/60">Loading...</div>
          ) : !item ? (
            <div className="text-white/60">Not found</div>
          ) : (
            <CourseForm
              mode="edit"
              locale={locale}
              initialValue={item}
              saving={saving}
              onSubmit={onSubmit}
              onReload={load}
            />
          )}
        </div>
      </div>
    </div>
  );
}
