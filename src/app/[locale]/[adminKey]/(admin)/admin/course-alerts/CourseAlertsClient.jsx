"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  { value: "", label: "ทั้งหมด" },
  { value: "active", label: "active" },
  { value: "unsubscribed", label: "unsubscribed" },
];

export default function CourseAlertsClient({ locale = "th", adminKey = "" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const baseAdmin = `/${locale}/${adminKey}/admin`;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const q0 = sp.get("q") || "";
  const status0 = sp.get("status") || "";
  const courseSlug0 = sp.get("courseSlug") || "";
  const page0 = Number(sp.get("page") || 1);

  const [q, setQ] = useState(q0);
  const [status, setStatus] = useState(status0);
  const [courseSlug, setCourseSlug] = useState(courseSlug0);

  useEffect(() => {
    setQ(q0);
    setStatus(status0);
    setCourseSlug(courseSlug0);
  }, [q0, status0, courseSlug0]);

  const query = useMemo(() => {
    const u = new URLSearchParams();
    if (q0) u.set("q", q0);
    if (status0) u.set("status", status0);
    if (courseSlug0) u.set("courseSlug", courseSlug0);
    u.set("page", String(page0 || 1));
    u.set("limit", "20");
    return u.toString();
  }, [q0, status0, courseSlug0, page0]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/course-alerts?${query}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Load failed");

      setItems(Array.isArray(data.items) ? data.items : []);
      setMeta({
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (e) {
      console.error(e);
      setItems([]);
      setMeta({ page: 1, limit: 20, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [query]);

  function applyFilters() {
    const u = new URLSearchParams();
    if (q.trim()) u.set("q", q.trim());
    if (status) u.set("status", status);
    if (courseSlug.trim()) u.set("courseSlug", courseSlug.trim());
    u.set("page", "1");
    router.push(`${baseAdmin}/course-alerts?${u.toString()}`);
  }

  function clearFilters() {
    router.push(`${baseAdmin}/course-alerts`);
  }

  function goPage(p) {
    const u = new URLSearchParams(sp.toString());
    u.set("page", String(p));
    router.push(`${baseAdmin}/course-alerts?${u.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">
              Course Alerts
            </div>
            <div className="mt-1 text-sm text-white/60">
              รายการอีเมลที่กด “แจ้งเตือนเมื่อเปิดรับ” (
              {meta.total.toLocaleString("th-TH")} รายการ)
            </div>
          </div>
          <div className="text-sm text-white/60">
            {loading ? "Loading..." : ""}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="mb-1 text-xs font-bold text-white/70">ค้นหา</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="email หรือ course slug"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
              />
            </div>

            <div className="md:col-span-3">
              <div className="mb-1 text-xs font-bold text-white/70">
                Course Slug
              </div>
              <input
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                placeholder="เช่น next-gen-..."
                className="h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-bold text-white/70">Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="h-10 rounded-xl bg-white/10 px-4 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="h-10 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-900 hover:bg-white/90"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Locale</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Notify</th>
                  <th className="px-4 py-3">Marketing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3">Last Notified</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 text-white/85">
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-white/60" colSpan={9}>
                      {loading ? "Loading..." : "ไม่พบข้อมูล"}
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it._id} className="hover:bg-white/5">
                      <td className="px-4 py-3">{it.email || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/80">
                        {it.courseSlug || "-"}
                      </td>
                      <td className="px-4 py-3 uppercase">
                        {it.locale || "th"}
                      </td>
                      <td className="px-4 py-3">{it.source || "unknown"}</td>
                      <td className="px-4 py-3">
                        {it.consentNotify ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">
                        {it.consentMarketing ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">{it.status || "active"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmtDate(it.subscribedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmtDate(it.lastNotifiedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm text-white/60">
              Page {meta.page} / {meta.totalPages}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => goPage(Math.max(1, meta.page - 1))}
                disabled={meta.page <= 1}
                className={cx(
                  "h-9 rounded-xl px-3 text-sm font-extrabold ring-1",
                  meta.page <= 1
                    ? "bg-white/5 text-white/30 ring-white/10"
                    : "bg-white/10 text-white ring-white/10 hover:bg-white/15",
                )}
              >
                Prev
              </button>
              <button
                onClick={() => goPage(Math.min(meta.totalPages, meta.page + 1))}
                disabled={meta.page >= meta.totalPages}
                className={cx(
                  "h-9 rounded-xl px-3 text-sm font-extrabold ring-1",
                  meta.page >= meta.totalPages
                    ? "bg-white/5 text-white/30 ring-white/10"
                    : "bg-white/10 text-white ring-white/10 hover:bg-white/15",
                )}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
