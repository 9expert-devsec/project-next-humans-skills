import Link from "next/link";

export default function AdminShell({
  locale = "th",
  active = "dashboard",
  children,
}) {
  const nav = [
    { key: "dashboard", label: "Registrations", href: `/${locale}/admin` },
    { key: "courses", label: "Courses", href: `/${locale}/admin/courses` },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1c2d",
        color: "white",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          borderRight: "1px solid rgba(255,255,255,.10)",
          background: "rgba(26,31,36,.35)",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgba(255,255,255,.10)",
          }}
        >
          <div style={{ fontWeight: 900, letterSpacing: 0.5 }}>NEXT SKILLS</div>
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>
            Admin Panel
          </div>
        </div>

        <nav
          style={{
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {nav.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "white",
                  background: isActive ? "rgba(59,130,246,.20)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(59,130,246,.35)"
                    : "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: 14, opacity: 0.65, fontSize: 12 }}>
          Base: #0b1c2d / #1a1f24
        </div>
      </aside>

      {/* Main */}
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
