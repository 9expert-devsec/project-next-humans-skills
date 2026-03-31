"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCheck,
  Download,
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

async function downloadCsvFromPost(url, body, filename = "export.csv") {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "download failed");
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(href);
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

function badgeClass(status) {
  const s = String(status || "new");
  if (s === "new") return "bg-sky-500/15 text-sky-200 ring-sky-400/20";
  if (s === "contacted")
    return "bg-amber-500/15 text-amber-200 ring-amber-400/20";
  if (s === "quoted")
    return "bg-violet-500/15 text-violet-200 ring-violet-400/20";
  if (s === "done")
    return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20";
  if (s === "cancelled") return "bg-rose-500/15 text-rose-200 ring-rose-400/20";
  return "bg-white/10 text-white/80 ring-white/10";
}

function statusLabel(status) {
  return String(status || "new");
}

const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "new", label: "new" },
  { value: "contacted", label: "contacted" },
  { value: "quoted", label: "quoted" },
  { value: "done", label: "done" },
  { value: "cancelled", label: "cancelled" },
];

const STATUS_OPTIONS_QUICK = [
  { value: "", label: "เลือกสถานะ..." },
  { value: "new", label: "new" },
  { value: "contacted", label: "contacted" },
  { value: "quoted", label: "quoted" },
  { value: "done", label: "done" },
  { value: "cancelled", label: "cancelled" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "ทุกช่องทาง" },
  { value: "Bitkub Academy", label: "Bitkub Academy" },
  { value: "9Expert Training", label: "9Expert Training" },
  { value: "Key Solutions Training", label: "Key Solutions Training" },
  { value: "Other", label: "Other" },
];

function renderSource(it) {
  const ch = String(it?.source_channel || "").trim();
  const other = String(it?.source_other || "").trim();
  const map = {
    "Bitkub Academy": "Bitkub Academy",
    "9Expert Training": "9Expert Training",
    "Key Solutions Training": "Key Solutions Training",
    Other: "Other",
  };

  if (!ch) return "-";
  if (ch === "Other") return other ? `Other: ${other}` : "Other";
  return map[ch] || ch;
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

export default function RegistrationsClient({ locale = "th", adminKey = "" }) {
  const baseAdmin = `/${locale}/${adminKey}/admin`;
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

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );
  const selectedCount = selectedIds.length;

  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  const q0 = sp.get("q") || "";
  const status0 = sp.get("status") || "";
  const courseSlug0 = sp.get("courseSlug") || "";
  const source0 = sp.get("source") || "";
  const from0 = sp.get("from") || "";
  const to0 = sp.get("to") || "";
  const page0 = Number(sp.get("page") || 1);

  const [q, setQ] = useState(q0);
  const [status, setStatus] = useState(status0);
  const [courseSlug, setCourseSlug] = useState(courseSlug0);
  const [source, setSource] = useState(source0);
  const [from, setFrom] = useState(from0);
  const [to, setTo] = useState(to0);

  useEffect(() => {
    setQ(q0);
    setStatus(status0);
    setCourseSlug(courseSlug0);
    setSource(source0);
    setFrom(from0);
    setTo(to0);
  }, [q0, status0, courseSlug0, source0, from0, to0]);

  const query = useMemo(() => {
    const u = new URLSearchParams();
    if (q0) u.set("q", q0);
    if (status0) u.set("status", status0);
    if (courseSlug0) u.set("courseSlug", courseSlug0);
    if (source0) u.set("source", source0);
    if (from0) u.set("from", from0);
    if (to0) u.set("to", to0);
    u.set("page", String(page0 || 1));
    u.set("limit", "20");
    return u.toString();
  }, [q0, status0, courseSlug0, source0, from0, to0, page0]);

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

      setSelected({});
      setBulkStatus("");
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
    if (source) u.set("source", source);
    if (from) u.set("from", from);
    if (to) u.set("to", to);
    u.set("page", "1");
    router.push(`${baseAdmin}/registrations?${u.toString()}`);
  }

  function clearFilters() {
    router.push(`${baseAdmin}/registrations`);
  }

  function goPage(p) {
    const u = new URLSearchParams(sp.toString());
    u.set("page", String(p));
    router.push(`${baseAdmin}/registrations?${u.toString()}`);
  }

  function toggleOne(id, checked) {
    setSelected((prev) => ({ ...prev, [id]: !!checked }));
  }

  function toggleAllOnPage(checked) {
    if (!checked) {
      setSelected({});
      return;
    }
    const next = {};
    for (const it of items) next[it._id] = true;
    setSelected(next);
  }

  const allOnPageChecked =
    items.length > 0 && items.every((it) => selected[it._id]);

  async function applyBulkStatus() {
    if (!selectedCount) {
      alert("กรุณาเลือกอย่างน้อย 1 รายการ");
      return;
    }
    if (!bulkStatus) {
      alert("กรุณาเลือกสถานะที่จะเปลี่ยน");
      return;
    }
    if (
      !confirm(
        `เปลี่ยนสถานะ ${selectedCount} รายการเป็น "${bulkStatus}" ใช่ไหม?`,
      )
    ) {
      return;
    }

    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/registrations/bulk-status", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) throw new Error(data?.error || "bulk update failed");
      await load();
    } catch (e) {
      console.error(e);
      alert("Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    const u = new URLSearchParams();
    if (q0) u.set("q", q0);
    if (status0) u.set("status", status0);
    if (courseSlug0) u.set("courseSlug", courseSlug0);
    if (source0) u.set("source", source0);
    if (from0) u.set("from", from0);
    if (to0) u.set("to", to0);
    const url = `/api/admin/registrations/export.csv?${u.toString()}`;
    window.open(url, "_blank");
  }

  async function exportSelectedCsv() {
    if (!selectedCount) {
      alert("กรุณาเลือกอย่างน้อย 1 รายการ");
      return;
    }

    setExportBusy(true);
    try {
      await downloadCsvFromPost(
        "/api/admin/registrations/export-selected.csv",
        { ids: selectedIds },
        "registrations-selected.csv",
      );
    } catch (e) {
      console.error(e);
      alert("Export selected failed");
    } finally {
      setExportBusy(false);
    }
  }

  function openDetail(id) {
    router.push(`${baseAdmin}/registrations/${id}`);
  }

  async function onDelete(id) {
    if (deletingId) return;
    if (!confirm("ยืนยันการลบรายการนี้ใช่ไหม?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
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

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  }

  const stats = useMemo(() => {
    const total = meta.total || 0;
    const currentPageItems = items.length;
    const doneCount = items.filter((x) => x?.status === "done").length;
    const newCount = items.filter(
      (x) => !x?.status || x?.status === "new",
    ).length;

    return {
      total,
      currentPageItems,
      doneCount,
      newCount,
    };
  }, [items, meta.total]);

  const printItems = useMemo(() => {
    if (selectedCount > 0) {
      return items.filter((it) => selected[it._id]);
    }
    return items;
  }, [items, selected, selectedCount]);

  const printColumns = useMemo(
    () => [
      { key: "reference", label: "Reference" },
      { key: "registrant", label: "Registrant" },
      { key: "contact", label: "Contact" },
      { key: "company", label: "Company" },
      { key: "course", label: "Course" },
      { key: "source", label: "Source" },
      { key: "createdAt", label: "Created" },
      { key: "status", label: "Status" },
    ],
    [],
  );

  const printRows = useMemo(() => {
    return printItems.map((it) => ({
      reference: cleanText(it.ref_no),
      registrant: `${it.first_name || ""} ${it.last_name || ""}`.trim() || "-",
      contact: [it.email, it.contact_phone].filter(Boolean).join(" / ") || "-",
      company: cleanText(it.company),
      course: cleanText(it.courseSlug),
      source: cleanText(renderSource(it)),
      createdAt: cleanText(fmtPrintDateTime(it.createdAt)),
      status: cleanText(statusLabel(it.status)),
    }));
  }, [printItems]);

  const printScopeLabel =
    selectedCount > 0
      ? `Selected rows (${selectedCount})`
      : `Current page (${items.length})`;

  const printFilters = useMemo(() => {
    return [
      { label: "Search", value: q0 },
      { label: "Status", value: status0 },
      { label: "Course Slug", value: courseSlug0 },
      { label: "Source", value: source0 },
      { label: "Date Range", value: fmtDateRange(from0, to0) },
      { label: "Scope", value: printScopeLabel },
      { label: "Page", value: String(meta.page || 1) },
    ].filter((x) => x.value);
  }, [
    q0,
    status0,
    courseSlug0,
    source0,
    from0,
    to0,
    printScopeLabel,
    meta.page,
  ]);

  const printSummary = useMemo(() => {
    return [
      { label: "Report Type", value: "Registrations" },
      { label: "Rows In This Print", value: String(printRows.length) },
      { label: "Total Results", value: String(meta.total || 0) },
    ];
  }, [printRows.length, meta.total]);

  function handleOpenPrint() {
    openAdminPrintWindow({
      brandTitle: "The Next Humans Skills",
      reportTitle: "Registrations Report",
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
              Registration operations
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Registrations
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              จัดการรายการลงทะเบียนทั้งหมด ค้นหา แก้สถานะ แก้ไขรายตัว ลบรายการ
              และ export ข้อมูลได้จากหน้าหลักเดียว
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
              {selectedCount > 0
                ? `Print Selected (${selectedCount})`
                : "Print"}
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
          label="Total Registrations"
          value={stats.total}
          hint="จำนวนรายการทั้งหมดตามผลลัพธ์ปัจจุบัน"
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
          icon={CheckCheck}
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
              placeholder="ชื่อ, อีเมล, บริษัท, tax_id, เบอร์, courseSlug, หรือ registrationId"
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

          <FilterSelect
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>

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
            <MetaBadge>Bulk actions</MetaBadge>
            <MetaBadge>CSV export</MetaBadge>
            <MetaBadge>Print preview</MetaBadge>
            <MetaBadge>Edit / Delete</MetaBadge>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] lg:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="text-sm text-white/70">
            Selected:{" "}
            <span className="font-extrabold text-white">{selectedCount}</span>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white outline-none transition focus:border-white/25"
            >
              {STATUS_OPTIONS_QUICK.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              onClick={applyBulkStatus}
              disabled={bulkBusy || selectedCount === 0}
              className={cx(
                "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold transition",
                bulkBusy || selectedCount === 0
                  ? "border border-white/10 bg-white/[0.03] text-white/30"
                  : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
              )}
            >
              {bulkBusy ? "Updating..." : "Apply Status"}
            </button>

            <button
              onClick={exportSelectedCsv}
              disabled={exportBusy || selectedCount === 0}
              className={cx(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition",
                exportBusy || selectedCount === 0
                  ? "border border-white/10 bg-white/[0.03] text-white/30"
                  : "bg-white text-slate-950 hover:bg-white/90",
              )}
            >
              <Download className="h-4 w-4" />
              {exportBusy ? "Exporting..." : "Export Selected CSV"}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-sm text-white/85">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.12em] text-white/38">
              <tr>
                <th className="px-6 py-4 font-bold">
                  <input
                    type="checkbox"
                    checked={!!allOnPageChecked}
                    onChange={(e) => toggleAllOnPage(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-4 font-bold">Registrant</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Course</th>
                <th className="px-6 py-4 font-bold">Source</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="border-t border-white/10">
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="text-lg font-bold text-white">
                        {loading
                          ? "Loading registrations..."
                          : "No registrations found"}
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
                      <input
                        type="checkbox"
                        checked={!!selected[it._id]}
                        onChange={(e) => toggleOne(it._id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => openDetail(it._id)}
                        className="max-w-[280px] text-left"
                      >
                        <div className="text-[15px] font-bold leading-6 text-white hover:text-cyan-200">
                          {`${it.first_name || ""} ${it.last_name || ""}`.trim() ||
                            "-"}
                        </div>
                        <div className="mt-1 font-mono text-xs text-white/45">
                          {it.ref_no || "-"}
                        </div>
                      </button>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-white/85">{it.email || "-"}</div>
                        <div className="text-white/55">
                          {it.contact_phone || "-"}
                        </div>
                        <div className="text-white/40">{it.company || "-"}</div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[240px]">
                        <div className="text-white/85">
                          {it.courseSlug || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-[220px] text-white/75">
                        {renderSource(it)}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="whitespace-nowrap text-white/75">
                        {fmtDate(it.createdAt)}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          badgeClass(it.status),
                        )}
                      >
                        {statusLabel(it.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(it._id)}
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

      <div className="text-xs text-white/40">
        * Export CSV = export ตาม filter · Export Selected CSV = export
        เฉพาะรายการที่เลือก · Print = preview ก่อน แล้วเปิดหน้าพิมพ์ในแท็บใหม่
      </div>

      <PrintPreviewModal
        open={printOpen}
        title={
          selectedCount > 0
            ? "Registrations Print Preview (Selected)"
            : "Registrations Print Preview"
        }
        subtitle="Preview the printable report before opening it in a new tab"
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
