"use client";

import { useState } from "react";

export default function AdminLoginClient({ locale = "th" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setErr(data?.message || "Login failed");
        return;
      }

      location.href = `/${locale}/admin`;
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,.12)",
          background: "rgba(26,31,36,.35)",
          borderRadius: 18,
          padding: 18,
        }}
      >
        <div style={{ fontWeight: 1000, fontSize: 22 }}>
          {locale === "en" ? "Admin Login" : "เข้าสู่ระบบแอดมิน"}
        </div>
        <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
          {locale === "en"
            ? "Sign in to manage courses and registrations."
            : "สำหรับจัดการคอร์สและข้อมูลลงทะเบียน"}
        </div>

        <form
          onSubmit={onSubmit}
          style={{ marginTop: 14, display: "grid", gap: 10 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              style={inputStyle}
              autoComplete="email"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {locale === "en" ? "Password" : "รหัสผ่าน"}
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              style={inputStyle}
              autoComplete="current-password"
            />
          </label>

          {err ? (
            <div
              style={{
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,80,80,.35)",
                background: "rgba(255,80,80,.10)",
                color: "rgba(255,255,255,.92)",
                fontSize: 13,
              }}
            >
              {err}
            </div>
          ) : null}

          <button
            disabled={loading}
            style={{
              marginTop: 8,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(59,130,246,.35)",
              background: "rgba(59,130,246,.18)",
              color: "white",
              fontWeight: 1000,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? locale === "en"
                ? "Signing in…"
                : "กำลังเข้าสู่ระบบ…"
              : locale === "en"
              ? "Sign in"
              : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  height: 40,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(11,28,45,.35)",
  color: "white",
  padding: "0 12px",
  outline: "none",
};
