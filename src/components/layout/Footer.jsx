"use client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

/* ---------- icons ---------- */
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.6 10.8c1.6 3.2 3.4 5 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.4 0 .8-.3 1.1L6.6 10.8z"
      />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.5 3A1 1 0 0 1 3 19.2V6a2 2 0 0 1 1-2z"
        opacity=".95"
      />
      <path
        fill="currentColor"
        d="M7.5 10.2a1 1 0 1 0 0-.01zm4.5 0a1 1 0 1 0 0-.01zm4.5 0a1 1 0 1 0 0-.01z"
      />
    </svg>
  );
}

/* ---------- clickable card (no <a> wrapper) ---------- */
function ClickableCard({ icon, title, subtitle, href, newTab = false }) {
  function open() {
    if (!href) return;
    if (newTab) {
      window.open(href, "_blank", "noreferrer");
      return;
    }
    window.location.href = href;
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      className={cx(
        "relative isolate overflow-hidden rounded-2xl p-4",
        "before:content-none after:content-none before:hidden after:hidden",
        "bg-white/5 ring-1 ring-white/10",
        "cursor-pointer select-none",
        "transition-all duration-200",
        "hover:bg-white/7 hover:ring-white/20 hover:-translate-y-[1px]",
        "active:translate-y-0 active:scale-[0.995]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 grid h-10 w-10 place-items-center rounded-2xl bg-white/7 ring-1 ring-white/10 text-white/80">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white/90">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-xs text-white/55">{subtitle}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


export default function Footer() {
  const year = new Date().getFullYear();

  const PHONE_TEXT = "081-908-6099";
  const PHONE_TEL = "0819086099";
  const EMAIL = "sirinthra.n@9expert.co.th";
  const LINE_URL = "https://line.me/R/ti/p/%409expert";

  const PHONE_TEXT2 = "082-925-4599";
  const PHONE_TEL2 = "0829254599";
  const EMAIL2 = "bovy.chayanee@bitkub.com";

  const PHONE_TEXT3 = "082-481-2442";
  const PHONE_TEL3 = "0824812442";
  const EMAIL3 = "nongnuch@keysolutionstraining.com";

  // ✅ เปลี่ยนจาก <footer> -> <div> เพื่อไม่ให้ซ้อน footer กับ layout
  return (
    <div className="relative mt-16 border-t border-white/10 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-5 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-baseline gap-3">
              <div className="text-xs tracking-[0.22em] text-white/55">
                THE NEXT
              </div>
              <div className="h-[1px] w-14 bg-gradient-to-r from-cyan-300/70 to-transparent" />
            </div>

            <div className="mt-1 text-3xl font-semibold leading-tight">
              Humans Skills
            </div>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
              สร้างทักษะให้เป็นบุคลากรในโลกยุคใหม่
            </p>

            {/* เผื่ออยากเปิด LINE ไว้ */}
            {/* <div className="mt-4">
              <ClickableCard
                icon={<IconChat />}
                title="LINE@ : 9expert"
                subtitle="แชทผ่าน LINE"
                href={LINE_URL}
                newTab
              />
            </div> */}
          </div>

          {/* Bitkub */}
          <div className="p-4 border-2 rounded-lg border-[#00B358]/40">
            <div className="mb-3 text-sm font-semibold text-white/90">
              ติดต่อ Bitkub Academy
            </div>

            <div className="flex flex-col gap-3">
              <ClickableCard
                icon={<IconPhone />}
                title={PHONE_TEXT2}
                subtitle="คุณโบวี่"
                href={`tel:${PHONE_TEL2}`}
              />

              <ClickableCard
                icon={<IconMail />}
                title={EMAIL2}
                subtitle="อีเมลติดต่อ"
                href={`mailto:${EMAIL2}`}
              />
            </div>
          </div>

          {/* 9Expert */}
          <div className="p-4 border-2 rounded-lg border-[#66ccff]/40">
            <div className="mb-3 text-sm font-semibold text-white/90">
              ติดต่อ 9Expert Training
            </div>

            <div className="flex flex-col gap-3">
              <ClickableCard
                icon={<IconPhone />}
                title={PHONE_TEXT}
                subtitle="คุณน้ำฝน"
                href={`tel:${PHONE_TEL}`}
              />

              <ClickableCard
                icon={<IconMail />}
                title={EMAIL}
                subtitle="อีเมลติดต่อ"
                href={`mailto:${EMAIL}`}
              />
            </div>

          </div>

          

          {/* Key Solutions */}
          <div className="p-4 border-2 rounded-lg border-[#F6D62D]/40">
            <div className="mb-3 text-sm font-semibold text-white/90">
              ติดต่อ Key Solutions Training
            </div>

            <div className="flex flex-col gap-3">
              <ClickableCard
                icon={<IconPhone />}
                title={PHONE_TEXT3}
                subtitle="คุณนุช"
                href={`tel:${PHONE_TEL3}`}
              />

              <ClickableCard
                icon={<IconMail />}
                title={EMAIL3}
                subtitle="อีเมลติดต่อ"
                href={`mailto:${EMAIL3}`}
              />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <div>© {year} The Next Humans Skills</div>
          <div className="flex items-center gap-3" />
        </div>
      </div>
    </div>
  );
}