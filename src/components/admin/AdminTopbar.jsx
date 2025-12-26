"use client";

export default function AdminTopbar({
  title = "Admin",
  subtitle,
  locale = "th",
}) {
  async function logout() {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    location.href = `/${locale}/admin/login`;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,28,45,.70)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <div className="text-sm font-extrabold text-white md:text-base">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-white/60">{subtitle}</div>
          ) : null}
        </div>

        <button
          onClick={logout}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold text-white hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
