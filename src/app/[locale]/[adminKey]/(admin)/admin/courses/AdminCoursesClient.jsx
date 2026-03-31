"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtMoney(n, currency = "THB") {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "-";
  return `${x.toLocaleString()} ${currency}`;
}

function MetaBadge({ children }) {
  if (!children) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/60">
      {children}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
        active
          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
          : "bg-slate-500/15 text-slate-300 ring-slate-500/30",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UpcomingBadge({ item }) {
  const isUpcoming = !!item?.isUpcoming;
  const tag = String(item?.upcomingTag || "").trim();

  if (!isUpcoming) {
    return (
      <span className="inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-white/55 ring-1 ring-white/10">
        No upcoming
      </span>
    );
  }

  if (tag === "full") {
    return (
      <span className="inline-flex rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-200 ring-1 ring-rose-500/30">
        Full
      </span>
    );
  }

  if (tag === "nearly_full") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-500/30">
        Nearly full
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-500/30">
      Open
    </span>
  );
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

export default function AdminCoursesClient({ locale, adminKey }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [upcomingFilter, setUpcomingFilter] = useState("all");

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    return sp.toString();
  }, [q]);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/courses?${query}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      setItems(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "active" && !item?.isActive) return false;
      if (statusFilter === "inactive" && item?.isActive) return false;

      if (upcomingFilter === "yes" && !item?.isUpcoming) return false;
      if (upcomingFilter === "none" && item?.isUpcoming) return false;
      if (
        upcomingFilter === "open" &&
        (!item?.isUpcoming || item?.upcomingTag === "full")
      ) {
        return false;
      }
      if (
        upcomingFilter === "full" &&
        (!item?.isUpcoming || item?.upcomingTag !== "full")
      ) {
        return false;
      }

      return true;
    });
  }, [items, statusFilter, upcomingFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => !!x?.isActive).length;
    const upcoming = items.filter((x) => !!x?.isUpcoming).length;
    const openUpcoming = items.filter(
      (x) => !!x?.isUpcoming && String(x?.upcomingTag || "") !== "full",
    ).length;

    return { total, active, upcoming, openUpcoming };
  }, [items]);

  const baseAdmin = `/${locale}/${adminKey}/admin`;

  function resetFilters() {
    setQ("");
    setStatusFilter("all");
    setUpcomingFilter("all");
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      load();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Course management
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Courses
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              จัดการคอร์สทั้งหมด สถานะการใช้งาน ราคา และข้อมูล Upcoming
              ให้เป็นระบบเดียวกันในหลังบ้าน
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

            <Link
              href={`${baseAdmin}/courses/new`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              New Course
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={stats.total}
          hint="จำนวนคอร์สทั้งหมดในระบบ"
        />
        <StatCard
          icon={Sparkles}
          label="Active"
          value={stats.active}
          hint="คอร์สที่เปิดใช้งานอยู่"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming"
          value={stats.upcoming}
          hint="คอร์สที่ตั้งเป็น upcoming"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Open for Enrollment"
          value={stats.openUpcoming}
          hint="upcoming ที่ยังไม่เต็ม"
        />
      </section>

      {/* Filters */}
      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] lg:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="ค้นหา title / slug"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </FilterSelect>

          <FilterSelect
            value={upcomingFilter}
            onChange={(e) => setUpcomingFilter(e.target.value)}
          >
            <option value="all">All Upcoming</option>
            <option value="yes">Upcoming only</option>
            <option value="open">Open upcoming</option>
            <option value="full">Full upcoming</option>
            <option value="none">No upcoming</option>
          </FilterSelect>

          <button
            onClick={load}
            className="h-11 rounded-2xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-white/90"
          >
            {loading ? "Loading..." : "Search"}
          </button>

          <button
            onClick={resetFilters}
            className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="text-sm text-white/45">
            Showing{" "}
            <span className="font-bold text-white/80">
              {visibleItems.length}
            </span>{" "}
            of <span className="font-bold text-white/80">{items.length}</span>{" "}
            courses
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaBadge>Enterprise Admin View</MetaBadge>
            <MetaBadge>Courses Master Template</MetaBadge>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] text-left text-sm text-white/85">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.12em] text-white/38">
              <tr>
                <th className="px-6 py-4 font-bold">Course</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold">Schedule</th>
                <th className="px-6 py-4 font-bold">Pricing</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.length === 0 ? (
                <tr className="border-t border-white/10">
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="text-lg font-bold text-white">
                        {loading ? "Loading courses..." : "No courses found"}
                      </div>
                      <p className="mt-2 text-sm text-white/45">
                        ลองค้นหาใหม่หรือกด Reset เพื่อเคลียร์ตัวกรอง
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map((c) => (
                  <tr
                    key={c._id}
                    className="border-t border-white/10 align-top transition hover:bg-white/[0.045]"
                  >
                    <td className="px-6 py-5">
                      <div className="max-w-[360px]">
                        <div className="text-[15px] font-bold leading-6 text-white">
                          {c.title_th || c.title_en || "Untitled Course"}
                        </div>

                        {c.title_en && c.title_en !== c.title_th ? (
                          <div className="mt-1 text-sm leading-6 text-white/45">
                            {c.title_en}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {c.level ? <MetaBadge>{c.level}</MetaBadge> : null}
                          {Array.isArray(c.partners) && c.partners[0] ? (
                            <MetaBadge>{c.partners[0]}</MetaBadge>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <code className="inline-flex max-w-[240px] rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
                        {c.slug || "-"}
                      </code>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-3">
                        <UpcomingBadge item={c} />

                        <div className="space-y-2 text-sm text-white/70">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-white/35" />
                            <span>{c.upcomingLocation || "-"}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 text-white/35" />
                            <span>{c.upcomingDateText || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-white/85">
                          Full:{" "}
                          {fmtMoney(
                            c?.business?.price_amount,
                            c?.business?.price_currency || "THB",
                          )}
                        </div>

                        <div className="text-sm font-semibold text-amber-200">
                          Early Bird:{" "}
                          {fmtMoney(
                            c?.business?.earlybird_price,
                            c?.business?.price_currency || "THB",
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <StatusBadge active={!!c.isActive} />
                        {c.status ? (
                          <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                            {c.status}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`${baseAdmin}/courses/${c._id}/edit`}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-white/90"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
