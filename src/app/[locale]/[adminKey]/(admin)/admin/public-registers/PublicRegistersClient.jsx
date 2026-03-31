"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  FileSpreadsheet,
  Filter,
  Pencil,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import PrintPreviewModal from "@/components/admin/PrintPreviewModal";
import { openAdminPrintWindow } from "@/lib/adminPrint";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function fmtPrintDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtDateRange(from, to) {
  if (from && to) return `${from} → ${to}`;
  if (from) return `ตั้งแต่ ${from}`;
  if (to) return `ถึง ${to}`;
  return "";
}

function cleanText(v) {
  const s = String(v ?? "").trim();
  return s || "-";
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

export default function PublicRegistersClient({
  locale = "th",
  adminKey = "",
}) {
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
  const [deletingId, setDeletingId] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

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

  useEffect(() => {
    setQ(q0);
    setStatus(status0);
    setCourseSlug(courseSlug0);
    setFrom(from0);
    setTo(to0);
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
      const res = await fetch(`/api/admin/public-registrations?${query}`, {
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
    if (from) u.set("from", from);
    if (to) u.set("to", to);
    u.set("page", "1");
    router.push(`${baseAdmin}/public-registers?${u.toString()}`);
  }

  function clearFilters() {
    router.push(`${baseAdmin}/public-registers`);
  }

  function goPage(p) {
    const u = new URLSearchParams(sp.toString());
    u.set("page", String(p));
    router.push(`${baseAdmin}/public-registers?${u.toString()}`);
  }

  function exportCsv() {
    const u = new URLSearchParams();
    if (q0) u.set("q", q0);
    if (status0) u.set("status", status0);
    if (courseSlug0) u.set("courseSlug", courseSlug0);
    if (from0) u.set("from", from0);
    if (to0) u.set("to", to0);
    const url = `/api/admin/public-registrations/export.csv?${u.toString()}`;
    window.open(url, "_blank");
  }

  async function onDelete(id) {
    if (deletingId) return;
    if (!confirm("ยืนยันการลบรายการนี้ใช่ไหม?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/public-registrations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  function openEdit(id) {
    router.push(`${baseAdmin}/public-registers/${id}`);
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
    const newCount = items.filter(
      (x) => !x?.status || x?.status === "new",
    ).length;
    const doneCount = items.filter((x) => x?.status === "done").length;

    return {
      total,
      currentPageItems,
      newCount,
      doneCount,
    };
  }, [items, meta.total]);

  const printColumns = useMemo(
    () => [
      { key: "createdAt", label: "Created" },
      { key: "reference", label: "Reference" },
      { key: "coordinator", label: "Coordinator" },
      { key: "contact", label: "Contact" },
      { key: "company", label: "Company" },
      { key: "course", label: "Course" },
      { key: "courseDate", label: "Course Date" },
      { key: "trainees", label: "Trainees" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status" },
    ],
    [],
  );

  const printRows = useMemo(() => {
    return items.map((it) => ({
      createdAt: cleanText(fmtPrintDateTime(it.createdAt)),
      reference: cleanText(it.ref_no),
      coordinator: cleanText(it.coordinatorName),
      contact:
        [it.coordinatorEmail, it.coordinatorPhone]
          .filter(Boolean)
          .join(" / ") || "-",
      company: cleanText(it.company),
      course: cleanText(it.courseTitle || it.courseSlug),
      courseDate: cleanText(it.courseDateText),
      trainees: String(it.traineeCount || 0),
      source: cleanText(it.sourceChannel),
      status: cleanText(it.status || "new"),
    }));
  }, [items]);

  const printFilters = useMemo(() => {
    return [
      { label: "Search", value: q0 },
      { label: "Status", value: status0 },
      { label: "Course Slug", value: courseSlug0 },
      { label: "Date Range", value: fmtDateRange(from0, to0) },
      { label: "Page", value: String(meta.page || 1) },
    ].filter((x) => x.value);
  }, [q0, status0, courseSlug0, from0, to0, meta.page]);

  const printSummary = useMemo(() => {
    return [
      { label: "Report Type", value: "Public Registers" },
      { label: "Rows In This Print", value: String(printRows.length) },
      { label: "Total Results", value: String(meta.total || 0) },
    ];
  }, [printRows.length, meta.total]);

  function handleOpenPrint() {
    openAdminPrintWindow({
      brandTitle: "The Next Humans Skills",
      reportTitle: "Public Registers Report",
      printedAt: fmtPrintDateTime(new Date().toISOString()),
      filters: printFilters,
      summary: printSummary,
      columns: printColumns,
      rows: printRows,
    });
    setPrintOpen(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Public registration records
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Public Registers
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              ตรวจสอบรายการลงทะเบียนจาก public flow ค้นหา กรอง แก้ไขรายตัว
              และลบข้อมูลผู้ประสานงาน คอร์ส
              และจำนวนผู้เข้าอบรมได้จากหน้าหลักเดียว
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

            <button
              onClick={() => setPrintOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-white/90"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Records"
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
          icon={Sparkles}
          label="New"
          value={stats.newCount}
          hint="รายการใหม่ในหน้าปัจจุบัน"
        />
        <StatCard
          icon={CalendarDays}
          label="Done"
          value={stats.doneCount}
          hint="รายการที่ปิดงานแล้วในหน้าปัจจุบัน"
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
              placeholder="ref, course, coordinator, email, company"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
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

          <div className="min-w-[220px] flex-1">
            <input
              value={courseSlug}
              onChange={(e) => setCourseSlug(e.target.value)}
              placeholder="Course slug"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
            />
          </div>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white outline-none transition focus:border-white/25"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white outline-none transition focus:border-white/25"
          />

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
            <MetaBadge>Public flow data</MetaBadge>
            <MetaBadge>CSV export</MetaBadge>
            <MetaBadge>Print preview</MetaBadge>
            <MetaBadge>Edit / Delete</MetaBadge>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-sm text-white/85">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.12em] text-white/38">
              <tr>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold">Reference</th>
                <th className="px-6 py-4 font-bold">Coordinator</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Company</th>
                <th className="px-6 py-4 font-bold">Course</th>
                <th className="px-6 py-4 font-bold">Course Date</th>
                <th className="px-6 py-4 font-bold">Trainees</th>
                <th className="px-6 py-4 font-bold">Source</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="border-t border-white/10">
                  <td colSpan={11} className="px-6 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="text-lg font-bold text-white">
                        {loading
                          ? "Loading public registers..."
                          : "No records found"}
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
                    <td className="whitespace-nowrap px-6 py-5 text-white/75">
                      {fmtDate(it.createdAt)}
                    </td>

                    <td className="px-6 py-5">
                      <code className="inline-flex rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
                        {it.ref_no || "-"}
                      </code>
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[220px]">
                        <div className="text-[15px] font-bold leading-6 text-white">
                          {it.coordinatorName || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-white/85">
                          {it.coordinatorEmail || "-"}
                        </div>
                        <div className="text-white/55">
                          {it.coordinatorPhone || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-white/75">
                      {it.company || "-"}
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[260px]">
                        <div className="font-semibold text-white/85">
                          {it.courseTitle || it.courseSlug || "-"}
                        </div>
                        {it.courseSlug ? (
                          <div className="mt-1 text-xs text-white/40">
                            {it.courseSlug}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-white/75">
                      {it.courseDateText || "-"}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/80">
                        {it.traineeCount || 0}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-white/75">
                      {it.sourceChannel || "-"}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          badge(it.status),
                        )}
                      >
                        {it.status || "new"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(it._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-white/90"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(it._id)}
                          disabled={deletingId === it._id}
                          className={cx(
                            "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition",
                            deletingId === it._id
                              ? "bg-rose-500/10 text-rose-100/40"
                              : "bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === it._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
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

      <PrintPreviewModal
        open={printOpen}
        title="Public Registers Print Preview"
        subtitle="Preview the current page before opening the printable report"
        filters={printFilters}
        summary={printSummary}
        columns={printColumns}
        rows={printRows}
        onClose={() => setPrintOpen(false)}
        onConfirm={handleOpenPrint}
      />
    </div>
  );
}
