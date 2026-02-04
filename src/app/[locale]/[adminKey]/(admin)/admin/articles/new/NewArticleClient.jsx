"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewArticleClient({ locale = "th", adminKey = "" }) {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function create() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, title }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Create failed");
      r.push(`/${locale}/${adminKey}/admin/articles/${j.item._id}`);
    } catch (e) {
      setErr(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-100">New Article</h1>
      <div className="mt-4 max-w-xl space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={locale === "en" ? "Article title" : "ชื่อบทความ"}
          className="h-11 w-full rounded-xl bg-white/5 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
        />
        {err ? <div className="text-sm text-rose-300">{err}</div> : null}
        <button
          type="button"
          disabled={busy}
          onClick={create}
          className="rounded-xl bg-sky-400/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {busy ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
