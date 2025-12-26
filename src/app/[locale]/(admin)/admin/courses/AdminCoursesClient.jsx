"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function Badge({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1",
        active
          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
          : "bg-rose-500/15 text-rose-200 ring-rose-500/30"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function AdminCoursesClient({ locale }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    return sp.toString();
  }, [q]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/courses?${query}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setItems(Array.isArray(data?.items) ? data.items : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* watermark (ลบทีหลังได้) */}
      <div className="fixed bottom-4 right-4 z-[9999] rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-500/30">
        USING: AdminCoursesClient.jsx (NEW)
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Courses
          </h1>
          <p className="mt-2 text-sm text-white/70">
            จัดการคอร์สทั้งหมด (สร้าง/แก้ไข/ราคา/สถานะ)
          </p>
        </div>

        <Link
          href={`/${locale}/admin/courses/new`}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-white/90"
        >
          + New Course
        </Link>
      </div>

      {/* filters */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา title / slug"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
          />
          <button
            onClick={load}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/15"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {/* table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm text-white/85">
            <thead className="bg-black/25 text-xs text-white/60">
              <tr>
                <th className="px-5 py-3 font-semibold">Title (TH)</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-white/50" colSpan={5}>
                    {loading ? "Loading..." : "No courses"}
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr
                    key={c._id}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">
                        {c.title_th}
                      </div>
                      {c.title_en ? (
                        <div className="mt-1 text-xs text-white/50">
                          {c.title_en}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">
                      <code className="rounded-lg bg-black/40 px-2 py-1 text-xs text-white/75">
                        {c.slug}
                      </code>
                    </td>

                    <td className="px-5 py-4">
                      {c?.business?.price_amount
                        ? `${Number(
                            c.business.price_amount
                          ).toLocaleString()} ${
                            c.business.price_currency || "THB"
                          }`
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <Badge active={!!c.isActive} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/${locale}/admin/courses/${c._id}/edit`}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-white/90"
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
      </div>
    </div>
  );
}
