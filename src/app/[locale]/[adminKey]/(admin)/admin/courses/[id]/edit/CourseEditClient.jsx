"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminCourseFormClient from "@/components/admin/courses/AdminCourseFormClient";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function CourseEditClient({
  locale = "th",
  adminKey = "",
  id = "",
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);

  const baseAdmin = useMemo(
    () => `/${locale}/${adminKey}/admin`,
    [locale, adminKey]
  );
  const backHref = useMemo(() => `${baseAdmin}/courses`, [baseAdmin]);

  async function load() {
    if (!id) return;
    setErr("");
    setLoading(true);
    try {
      // ✅ ใช้ route รายตัวที่คุณมีอยู่แล้ว
      const res = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || `Load failed (${res.status})`);
      setItem(data.item || null);
    } catch (e) {
      setErr(e?.message || "Load failed");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div>
      {/* <AdminTopbar
        title="Edit Course"
        subtitle={item?.title_th ? item.title_th : `#${id}`}
        locale={locale}
      /> */}

      <div className=" p-4 ">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">แก้ไขคอร์ส</h1>
            <p className="mt-1 text-sm text-white/60">
              แก้ข้อมูลคอร์ส และบันทึกด้วยปุ่ม Save
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10"
            >
              ← กลับไปหน้ารวม
            </Link>

            {/* ปุ่ม Reload ไว้กัน error/load */}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-extrabold",
                "border border-white/10 bg-white/5 text-white/80",
                "hover:bg-white/10 disabled:opacity-60"
              )}
            >
              Reload
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
            <AdminCourseFormClient
              mode="edit"
              locale={locale}
              adminKey={adminKey}
              initial={item}
            />
          )}
        </div>

        {/* NOTE: ถ้าคุณยังต้องการปุ่ม Delete ในหน้านี้
            ให้บอกผม เดี๋ยวผมเพิ่มให้ โดยยิง DELETE /api/admin/courses/[id] */}
      </div>
    </div>
  );
}
