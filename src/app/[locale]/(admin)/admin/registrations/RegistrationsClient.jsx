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

function badge(status) {
  const s = String(status || "new");
  if (s === "new") return "bg-sky-500/15 text-sky-200 ring-sky-400/20";
  if (s === "contacted")
    return "bg-amber-500/15 text-amber-200 ring-amber-400/20";
  if (s === "done")
    return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20";
  if (s === "cancelled") return "bg-rose-500/15 text-rose-200 ring-rose-400/20";
  return "bg-white/10 text-white/80 ring-white/10";
}

const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "new", label: "new" },
  { value: "contacted", label: "contacted" },
  { value: "done", label: "done" },
  { value: "cancelled", label: "cancelled" },
];

export default function RegistrationsClient({ locale = "th" }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // filters from querystring
  const q0 = sp.get("q") || "";
  const status0 = sp.get("status") || "";
  const courseSlug0 = sp.get("courseSlug") || "";
  const from0 = sp.get("from") || "";
  const to0 = sp.get("to") || "";
  const page0 = Number(sp.get("page") || 1);

  const [q, setQ] = useState(q0);
  const [status, setStatus] = useState(status0);
  const [courseSlug, setCourseSlug] = useState(courseSlug0);
  const [from, setFrom] = useState(from0);
  const [to, setTo] = useState(to0);

  // sync input when URL changed (back/forward)
  useEffect(() => {
    setQ(q0);
    setStatus(status0);
    setCourseSlug(courseSlug0);
    setFrom(from0);
    setTo(to0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q0, status0, courseSlug0, from0, to0]);

  const query = useMemo(() => {
    const u = new URLSearchParams();
    if (q0) u.set("q", q0);
    if (status0) u.set("status", status0);
    if (courseSlug0) u.set("courseSlug", courseSlug0);
    if (from0) u.set("from", from0);
    if (to0) u.set("to", to0);
    u.set("page", String(page0 || 1));
    u.set("limit", "20");
    return u.toString();
  }, [q0, status0, courseSlug0, from0, to0, page0]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations?${query}`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function applyFilters() {
    const u = new URLSearchParams();
    if (q.trim()) u.set("q", q.trim());
    if (status) u.set("status", status);
    if (courseSlug.trim()) u.set("courseSlug", courseSlug.trim());
    if (from) u.set("from", from);
    if (to) u.set("to", to);
    u.set("page", "1");
    router.push(`/${locale}/admin/registrations?${u.toString()}`);
  }

  function clearFilters() {
    router.push(`/${locale}/admin/registrations`);
  }

  function goPage(p) {
    const u = new URLSearchParams(sp.toString());
    u.set("page", String(p));
    router.push(`/${locale}/admin/registrations?${u.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">
              Registrations
            </div>
            <div className="mt-1 text-sm text-white/60">
              รายการลงทะเบียนทั้งหมด ({meta.total.toLocaleString("th-TH")}{" "}
              รายการ)
            </div>
          </div>

          <div className="text-sm text-white/60">
            {loading ? "Loading..." : ""}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="mb-1 text-xs font-bold text-white/70">ค้นหา</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ชื่อ, อีเมล, บริษัท, tax_id, เบอร์, courseSlug, หรือ registrationId"
                className={cx(
                  "h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none",
                  "placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-bold text-white/70">สถานะ</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={cx(
                  "h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none",
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

            <div className="md:col-span-3">
              <div className="mb-1 text-xs font-bold text-white/70">
                Course Slug
              </div>
              <input
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                placeholder="เช่น next-gen-..."
                className={cx(
                  "h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none",
                  "placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
              />
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-xs font-bold text-white/70">
                  จากวันที่
                </div>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={cx(
                    "h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none",
                    "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  )}
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-bold text-white/70">
                  ถึงวันที่
                </div>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={cx(
                    "h-10 w-full rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none",
                    "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
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

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 text-white/85">
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-white/60" colSpan={8}>
                      {loading ? "Loading..." : "ไม่พบข้อมูล"}
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr
                      key={it._id}
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() =>
                        router.push(`/${locale}/admin/registrations/${it._id}`)
                      }
                      title="คลิกเพื่อดูรายละเอียด"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmtDate(it.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/75">
                        {String(it._id).slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        {(it.first_name || "") + " " + (it.last_name || "")}
                      </td>
                      <td className="px-4 py-3">{it.email || "-"}</td>
                      <td className="px-4 py-3">{it.contact_phone || "-"}</td>
                      <td className="px-4 py-3">{it.company || "-"}</td>
                      <td className="px-4 py-3">{it.courseSlug || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            "inline-flex rounded-full px-2 py-1 text-xs font-bold ring-1",
                            badge(it.status)
                          )}
                        >
                          {it.status || "new"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                    : "bg-white/10 text-white ring-white/10 hover:bg-white/15"
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
                    : "bg-white/10 text-white ring-white/10 hover:bg-white/15"
                )}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-white/40">
          * คลิกแถวเพื่อไปหน้า detail (เดี๋ยวเราทำต่อ)
        </div>
      </div>
    </div>
  );
}
