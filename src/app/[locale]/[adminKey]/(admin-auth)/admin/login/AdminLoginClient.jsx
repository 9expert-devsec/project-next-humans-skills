"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function AdminLoginClient({ locale = "th", adminKey = "" }) {
  const sp = useSearchParams();

  const adminHome = useMemo(() => {
    // fallback ที่ถูกต้อง: ไปหน้า admin home
    return `/${locale}/${adminKey}/admin`;
  }, [locale, adminKey]);

  const nextUrl = useMemo(() => {
    const n = sp.get("next");
    // ถ้าไม่มี next ให้ไปหน้า admin home
    return n && n.startsWith("/") ? n : adminHome;
  }, [sp, adminHome]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setErr("");

    try {
      setBusy(true);

      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || "Login failed");
      }

      // hard nav เพื่อให้ request ถัดไปส่ง cookie ชัวร์
      window.location.href = nextUrl;
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-md px-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white text-xl font-extrabold">Admin Login</div>
        <div className="mt-1 text-white/60 text-sm">
          {locale === "en"
            ? "Please sign in to continue"
            : "เข้าสู่ระบบเพื่อไปต่อ"}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-white/80 text-sm mb-1">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="admin@local"
              autoComplete="username"
              disabled={busy}
            />
          </label>

          <label className="block">
            <div className="text-white/80 text-sm mb-1">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="••••"
              autoComplete="current-password"
              disabled={busy}
            />
          </label>

          {err ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className={cx(
              "w-full rounded-xl px-4 py-2 text-white font-extrabold",
              busy
                ? "bg-white/10 cursor-not-allowed"
                : "bg-white/15 hover:bg-white/20"
            )}
          >
            {busy
              ? locale === "en"
                ? "Signing in..."
                : "กำลังเข้าสู่ระบบ..."
              : "Login"}
          </button>

          <div className="text-xs text-white/50">
            next: <span className="text-white/70">{nextUrl}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
