"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function AdminLoginClient({ locale = "th", adminKey = "" }) {
  const sp = useSearchParams();

  const adminHome = useMemo(() => {
    return `/${locale}/${adminKey}/admin`;
  }, [locale, adminKey]);

  const nextUrl = useMemo(() => {
    const n = sp.get("next");
    return n && n.startsWith("/") ? n : adminHome;
  }, [sp, adminHome]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

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
        body: JSON.stringify({ email, password, adminKey }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(
          data?.message ||
            (locale === "en"
              ? "Unable to sign in. Please check your credentials."
              : "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน"),
        );
      }

      window.location.href = nextUrl;
    } catch (e2) {
      setErr(
        e2?.message ||
          (locale === "en" ? "Login failed" : "เข้าสู่ระบบไม่สำเร็จ"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[#071321] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_30px_100px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%)] p-8 lg:block xl:p-10">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin access
                </div>

                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white">
                  NEXT SKILLS
                  <br />
                  Admin Panel
                </h1>

                <p className="mt-4 max-w-md text-sm leading-7 text-white/60">
                  {locale === "en"
                    ? "Secure sign-in for managing courses, registrations, public registers, course alerts, media, and articles."
                    : "กรุณาเข้าสู่ระบบด้วยข้อมูลบัญชีที่ถูกต้องเพื่อดำเนินการต่อ"}
                </p>


              </div>


            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
              <div className="mb-6 lg:hidden">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin access
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  {locale === "en" ? "Admin Login" : "เข้าสู่ระบบ"}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/55">
                  {locale === "en"
                    ? "Sign in to continue to the admin workspace."
                    : "กรุณายืนยันตัวตนเพื่อเข้าใช้งานระบบ"}
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/75">
                    Email
                  </div>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b1727] pl-11 pr-4 text-white placeholder:text-white/30 outline-none transition focus:border-white/25"
                      placeholder="admin"
                      autoComplete="username"
                      disabled={busy}
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/75">
                    Password
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPwd ? "text" : "password"}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b1727] pl-11 pr-12 text-white placeholder:text-white/30 outline-none transition focus:border-white/25"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-white/45 transition hover:bg-white/5 hover:text-white/80"
                      tabIndex={-1}
                    >
                      {showPwd ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                {err ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {err}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className={cx(
                    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition",
                    busy
                      ? "cursor-not-allowed border border-white/10 bg-white/[0.03] text-white/30"
                      : "bg-white text-slate-950 hover:bg-white/90",
                  )}
                >
                  <ArrowRight className="h-4 w-4" />
                  {busy
                    ? locale === "en"
                      ? "Signing in..."
                      : "กำลังเข้าสู่ระบบ..."
                    : locale === "en"
                      ? "Login"
                      : "เข้าสู่ระบบ"}
                </button>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/45 lg:hidden">
                  <span className="font-semibold text-white/70">Next:</span>{" "}
                  <span className="break-all">{nextUrl}</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
