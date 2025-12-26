"use client";

import { useMemo, useState } from "react";
import CourseForm from "@/components/admin/courses/CourseForm";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminCourseFormClient({ locale = "th" }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const backHref = useMemo(() => `/${locale}/admin/courses`, [locale]);

  async function onSubmit(values) {
    setErr("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Create failed (${res.status})`);
      }
      // ไปหน้า edit ของตัวที่สร้างใหม่
      location.href = `/${locale}/admin/courses/${data.item._id}/edit`;
    } catch (e) {
      setErr(e?.message || "Create failed");
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminTopbar
        title="New Course"
        subtitle="สร้างคอร์สใหม่"
        locale={locale}
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">สร้างคอร์สใหม่</h1>
          <p className="mt-1 text-sm text-white/60">
            กรอกข้อมูลหลัก แล้วกด Save เพื่อสร้างคอร์ส
          </p>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <CourseForm
            mode="create"
            locale={locale}
            initialValue={null}
            saving={saving}
            onSubmit={onSubmit}
            backHref={backHref}
          />
        </div>
      </div>
    </div>
  );
}
