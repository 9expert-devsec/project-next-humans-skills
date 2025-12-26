"use client";

import Link from "next/link";

export default function AdminDashboardClient({ locale = "th" }) {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,.12)",
          background: "rgba(26,31,36,.35)",
          borderRadius: 18,
          padding: 18,
        }}
      >
        <div style={{ fontWeight: 1000, fontSize: 22 }}>
          {locale === "en" ? "Admin Dashboard" : "แดชบอร์ดแอดมิน"}
        </div>
        <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
          {locale === "en"
            ? "Manage registrations and courses."
            : "จัดการรายการลงทะเบียนและคอร์ส"}
        </div>

        <div
          style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          <Link href={`/${locale}/admin/registrations`} style={btnStyle}>
            {locale === "en" ? "Registrations" : "รายการลงทะเบียน"}
          </Link>
          <Link href={`/${locale}/admin/courses`} style={btnStyle}>
            {locale === "en" ? "Courses" : "จัดการคอร์ส"}
          </Link>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(59,130,246,.35)",
  background: "rgba(59,130,246,.18)",
  color: "white",
  textDecoration: "none",
  fontWeight: 1000,
};
