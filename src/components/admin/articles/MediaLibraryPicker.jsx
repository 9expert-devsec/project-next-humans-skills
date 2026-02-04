"use client";

import { useEffect, useState } from "react";

export default function MediaLibraryPicker({
  open,
  onClose,
  onPick,
  title = "Media Library",
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load(page = 1) {
    setLoading(true);
    setErr("");
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("limit", "24");
      if (q.trim()) sp.set("q", q.trim());

      const res = await fetch(`/api/admin/media-assets?${sp.toString()}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Load failed");
      setItems(j.items || []);
    } catch (e) {
      setErr(e?.message || "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="text-sm font-medium text-slate-100">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-100 hover:bg-white/15"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา alt/caption/publicId..."
              className="h-10 flex-1 rounded-xl bg-white/5 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
            />
            <button
              type="button"
              onClick={() => load(1)}
              className="h-10 rounded-xl bg-white/10 px-4 text-sm font-medium text-slate-100 hover:bg-white/15"
            >
              Search
            </button>
          </div>

          {err ? <div className="mt-3 text-sm text-rose-300">{err}</div> : null}
          {loading ? (
            <div className="mt-3 text-sm text-slate-300">Loading...</div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {items.map((it) => (
              <button
                key={it._id}
                type="button"
                onClick={() => onPick?.(it)}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/10"
                title="Pick"
              >
                <img
                  src={it.url}
                  alt={it.alt || ""}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-2">
                  <div className="text-xs text-slate-200 line-clamp-1">
                    {it.caption || it.alt || it.publicId}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {it.publicId}
                  </div>
                </div>
              </button>
            ))}

            {!loading && items.length === 0 ? (
              <div className="col-span-2 md:col-span-4 text-sm text-slate-400">
                ไม่มีรูปในคลัง
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
