"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Filter,
  PencilLine,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function statusBadgeClass(status) {
  const s = String(status || "draft");
  if (s === "published") {
    return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20";
  }
  if (s === "archived") {
    return "bg-rose-500/15 text-rose-200 ring-rose-400/20";
  }
  return "bg-amber-500/15 text-amber-200 ring-amber-400/20";
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

export default function ArticlesListClient({ locale = "th", adminKey = "" }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(() => {
    const t = Number(meta.total || 0);
    const l = Number(meta.limit || 20);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  const stats = useMemo(() => {
    const total = Number(meta.total || 0);
    const currentPageItems = items.length;
    const publishedCount = items.filter(
      (x) => x?.status === "published",
    ).length;
    const draftCount = items.filter(
      (x) => !x?.status || x?.status === "draft",
    ).length;

    return {
      total,
      currentPageItems,
      publishedCount,
      draftCount,
    };
  }, [items, meta.total]);

  async function load(page = 1, nextQ = q, nextStatus = status) {
    setLoading(true);
    setErr("");

    try {
      const sp = new URLSearchParams();
      sp.set("locale", locale);
      sp.set("page", String(page));
      if (String(nextQ || "").trim()) sp.set("q", String(nextQ || "").trim());
      if (nextStatus) sp.set("status", nextStatus);

      const res = await fetch(`/api/admin/articles?${sp.toString()}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Load failed");

      setItems(Array.isArray(j.items) ? j.items : []);
      setMeta({
        page: j.page || 1,
        limit: j.limit || 20,
        total: j.total || 0,
      });
    } catch (e) {
      setErr(e?.message || "Error");
      setItems([]);
      setMeta({ page: 1, limit: 20, total: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function clearFilters() {
    setQ("");
    setStatus("");
    load(1, "", "");
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      load(1);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Editorial content management
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Articles
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              จัดการบทความทั้งหมดของระบบ ค้นหา แยกสถานะ
              และเข้าแก้ไขบทความได้จากหน้าหลักเดียว
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => load(meta.page || 1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>

            <Link
              href={`/${locale}/${adminKey}/admin/articles/new`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-white/90"
            >
              <PencilLine className="h-4 w-4" />
              New Article
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Articles"
          value={stats.total}
          hint="จำนวนบทความทั้งหมดตามผลลัพธ์ปัจจุบัน"
        />
        <StatCard
          icon={Filter}
          label="Current Page"
          value={stats.currentPageItems}
          hint="จำนวนบทความในหน้าที่กำลังดู"
        />
        <StatCard
          icon={Sparkles}
          label="Published"
          value={stats.publishedCount}
          hint="บทความที่เผยแพร่แล้วในหน้าปัจจุบัน"
        />
        <StatCard
          icon={PencilLine}
          label="Draft"
          value={stats.draftCount}
          hint="บทความร่างในหน้าปัจจุบัน"
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
              placeholder="ค้นหา title / slug / excerpt"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
            />
          </div>

          <FilterSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All status</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </FilterSelect>

          <button
            type="button"
            onClick={() => load(1)}
            className="h-11 rounded-2xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-white/90"
          >
            {loading ? "Loading..." : "Search"}
          </button>

          <button
            type="button"
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
            <span className="font-bold text-white/80">{totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaBadge>Lexical editor</MetaBadge>
            <MetaBadge>Editorial workflow</MetaBadge>
            <MetaBadge>Enterprise Admin View</MetaBadge>
          </div>
        </div>
      </section>

      {err ? (
        <section className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {err}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm text-white/85">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.12em] text-white/38">
              <tr>
                <th className="px-6 py-4 font-bold">Article</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Updated</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="border-t border-white/10">
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="text-lg font-bold text-white">
                        {loading ? "Loading articles..." : "ไม่มีบทความ"}
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
                      <div className="max-w-[420px]">
                        <Link
                          href={`/${locale}/${adminKey}/admin/articles/${it._id}`}
                          className="text-[15px] font-bold leading-6 text-white hover:text-cyan-200"
                        >
                          {it.title}
                        </Link>

                        {it.excerpt ? (
                          <div className="mt-1 line-clamp-2 text-sm leading-6 text-white/45">
                            {it.excerpt}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <code className="inline-flex max-w-[260px] rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
                        {it.slug || "-"}
                      </code>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          statusBadgeClass(it.status),
                        )}
                      >
                        {it.status || "draft"}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-white/75">
                      {fmtDate(it.updatedAt)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/${locale}/${adminKey}/admin/articles/${it._id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-white/90"
                      >
                        Open
                      </Link>
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
            <span className="font-bold text-white/80">{totalPages}</span>
            {" · "}
            Total <span className="font-bold text-white/80">{meta.total}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => load(meta.page - 1)}
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
              type="button"
              disabled={meta.page >= totalPages}
              onClick={() => load(meta.page + 1)}
              className={cx(
                "h-10 rounded-2xl px-4 text-sm font-bold transition",
                meta.page >= totalPages
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
