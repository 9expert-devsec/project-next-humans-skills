"use client";

import { useEffect, useState } from "react";

export default function AdminGuard({ children, locale = "th" }) {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const res = await fetch("/api/admin/registrations?limit=1", {
          credentials: "include",
          cache: "no-store",
        });
        if (!alive) return;

        if (res.status === 401) {
          location.href = `/${locale}/admin/login`;
          return;
        }
        setOk(true);
      } catch {
        // ถ้า network error ก็ถือว่าไม่ผ่าน
        location.href = `/${locale}/admin/login`;
      } finally {
        if (alive) setLoading(false);
      }
    }

    check();
    return () => {
      alive = false;
    };
  }, [locale]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ opacity: 0.8 }}>Loading…</div>
      </div>
    );
  }

  if (!ok) return null;
  return children;
}
