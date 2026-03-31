"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "active", label: "active" },
  { value: "unsubscribed", label: "unsubscribed" },
];

function statusBadge(status) {
  const s = String(status || "active");
  if (s === "active")
    return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20";
  if (s === "unsubscribed")
    return "bg-rose-500/15 text-rose-200 ring-rose-400/20";
  return "bg-white/10 text-white/80 ring-white/10";
}

function consentBadge(ok) {
  return ok
    ? "bg-sky-500/15 text-sky-200 ring-sky-400/20"
    : "bg-white/8 text-white/60 ring-white/10";
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/55">{label}</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs font-medium text-white/40">{hint}</div>
          ) : null}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Icon className="h-5 w-5 text-white/75" />
        </div>
      </div>
    </div>
  );
}

function MetaBadge({ children }) {
  if (!children) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/60">
      {children}
    </span>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-11 rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm font-medium text-white outline-none transition focus:border-white/25"
    >
      {children}
    </select>
  );
}

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

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  }

  const stats = useMemo(() => {
    const total = meta.total || 0;
    const currentPageItems = items.length;
    const activeCount = items.filter(
      (x) => String(x?.status || "active") === "active",
    ).length;
    const unsubscribedCount = items.filter(
      (x) => String(x?.status || "") === "unsubscribed",
    ).length;

    return {
      total,
      currentPageItems,
      activeCount,
      unsubscribedCount,
    };
  }, [items, meta.total]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Alert subscriber records
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Course Alerts
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              ติดตามรายการอีเมลที่กด “แจ้งเตือนเมื่อเปิดรับ” ตรวจสอบความยินยอม
              สถานะการติดตาม และเวลาแจ้งเตือนล่าสุดได้จากหน้าหลักเดียว
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Subscribers"
          value={stats.total}
          hint="จำนวนรายการทั้งหมดตาม filter ปัจจุบัน"
        />
        <StatCard
          icon={Filter}
          label="Current Page"
          value={stats.currentPageItems}
          hint="จำนวนรายการในหน้าที่กำลังดู"
        />
        <StatCard
          icon={BellRing}
          label="Active"
          value={stats.activeCount}
          hint="รายการที่ยังเปิดรับการแจ้งเตือน"
        />
        <StatCard
          icon={CalendarDays}
          label="Unsubscribed"
          value={stats.unsubscribedCount}
          hint="รายการที่ยกเลิกการติดตามแล้ว"
        />
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] lg:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
          <div className="relative min-w-0 flex-[1.4]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="ค้นหา email หรือ course slug"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
            />
          </div>

          <div className="min-w-[220px] flex-1">
            <input
              value={courseSlug}
              onChange={(e) => setCourseSlug(e.target.value)}
              placeholder="Course slug"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
            />
          </div>

          <FilterSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>

          <button
            onClick={applyFilters}
            className="h-11 rounded-2xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-white/90"
          >
            Apply
          </button>

          <button
            onClick={clearFilters}
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="text-sm text-white/45">
            Showing{" "}
            <span className="font-bold text-white/80">{items.length}</span>{" "}
            items on this page · Page{" "}
            <span className="font-bold text-white/80">{meta.page}</span> /{" "}
            <span className="font-bold text-white/80">{meta.totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaBadge>Consent tracking</MetaBadge>
            <MetaBadge>Email alert subscribers</MetaBadge>
            <MetaBadge>Enterprise Admin View</MetaBadge>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-sm text-white/85">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.12em] text-white/38">
              <tr>
                <th className="px-6 py-4 font-bold">Subscriber</th>
                <th className="px-6 py-4 font-bold">Course</th>
                <th className="px-6 py-4 font-bold">Locale</th>
                <th className="px-6 py-4 font-bold">Source</th>
                <th className="px-6 py-4 font-bold">Notify</th>
                <th className="px-6 py-4 font-bold">Marketing</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Subscribed</th>
                <th className="px-6 py-4 font-bold">Last Notified</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="border-t border-white/10">
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="text-lg font-bold text-white">
                        {loading
                          ? "Loading course alerts..."
                          : "No subscribers found"}
                      </div>
                      <p className="mt-2 text-sm text-white/45">
                        ลองค้นหาใหม่หรือกด Reset เพื่อเคลียร์ตัวกรอง
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it._id}
                    className="border-t border-white/10 align-top transition hover:bg-white/[0.045]"
                  >
                    <td className="px-6 py-5">
                      <div className="max-w-[280px]">
                        <div className="text-[15px] font-bold leading-6 text-white">
                          {it.email || "-"}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">
                          subscriber
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <code className="inline-flex max-w-[260px] rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
                        {it.courseSlug || "-"}
                      </code>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase text-white/80">
                        {it.locale || "th"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-white/75">
                      {it.source || "unknown"}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          consentBadge(!!it.consentNotify),
                        )}
                      >
                        {it.consentNotify ? "Yes" : "No"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          consentBadge(!!it.consentMarketing),
                        )}
                      >
                        {it.consentMarketing ? "Yes" : "No"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          statusBadge(it.status),
                        )}
                      >
                        {it.status || "active"}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-white/75">
                      {fmtDate(it.subscribedAt)}
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-white/75">
                      {fmtDate(it.lastNotifiedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-white/55">
            Page <span className="font-bold text-white/80">{meta.page}</span> of{" "}
            <span className="font-bold text-white/80">{meta.totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => goPage(Math.max(1, meta.page - 1))}
              disabled={meta.page <= 1}
              className={cx(
                "h-10 rounded-2xl px-4 text-sm font-bold transition",
                meta.page <= 1
                  ? "border border-white/10 bg-white/[0.03] text-white/30"
                  : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
              )}
            >
              Prev
            </button>

            <button
              onClick={() => goPage(Math.min(meta.totalPages, meta.page + 1))}
              disabled={meta.page >= meta.totalPages}
              className={cx(
                "h-10 rounded-2xl px-4 text-sm font-bold transition",
                meta.page >= meta.totalPages
                  ? "border border-white/10 bg-white/[0.03] text-white/30"
                  : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
              )}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
