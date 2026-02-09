"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function ArticlesListClient({ locale = "th", adminKey = "" }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load(page = 1) {
    setLoading(true);
    setErr("");
    try {
      const sp = new URLSearchParams();
      sp.set("locale", locale);
      sp.set("page", String(page));
      if (q.trim()) sp.set("q", q.trim());
      if (status) sp.set("status", status);

      const res = await fetch(`/api/admin/articles?${sp.toString()}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Load failed");
      setItems(j.items || []);
      setMeta({ page: j.page, limit: j.limit, total: j.total });
    } catch (e) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const totalPages = useMemo(() => {
    const t = Number(meta.total || 0);
    const l = Number(meta.limit || 20);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Articles</h1>
          <p className="text-sm text-slate-400">จัดการบทความ (Lexical)</p>
        </div>
        <Link
          href={`/${locale}/${adminKey}/admin/articles/new`}
          className="rounded-xl bg-sky-400/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          + New article
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา title/slug/excerpt..."
          className="h-11 rounded-xl bg-white/5 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-xl bg-white/5 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
        >
          <option value="">All status</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>

        <button
          type="button"
          onClick={() => load(1)}
          className="h-11 rounded-xl bg-white/10 px-3 text-sm font-medium text-slate-100 hover:bg-white/15"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {err ? <div className="mt-4 text-sm text-rose-300">{err}</div> : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-100">
            {items.map((it) => (
              <tr key={it._id} className="hover:bg-white/5">
                <td className="p-3">
                  <Link
                    href={`/${locale}/${adminKey}/admin/articles/${it._id}`}
                    className="font-medium hover:underline"
                  >
                    {it.title}
                  </Link>
                </td>
                <td className="p-3 text-slate-300">{it.slug}</td>
                <td className="p-3">
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-xs">
                    {it.status}
                  </span>
                </td>
                <td className="p-3 text-slate-300">
                  {it.updatedAt
                    ? new Date(it.updatedAt).toLocaleString("th-TH")
                    : "-"}
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="p-6 text-slate-400" colSpan={4}>
                  ไม่มีบทความ
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <div>
          Page {meta.page} / {totalPages} • Total {meta.total}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => load(meta.page - 1)}
            className={cx(
              "rounded-xl px-3 py-2",
              meta.page <= 1
                ? "bg-white/5 text-slate-500"
                : "bg-white/10 hover:bg-white/15",
            )}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={meta.page >= totalPages}
            onClick={() => load(meta.page + 1)}
            className={cx(
              "rounded-xl px-3 py-2",
              meta.page >= totalPages
                ? "bg-white/5 text-slate-500"
                : "bg-white/10 hover:bg-white/15",
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
