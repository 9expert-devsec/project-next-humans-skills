import React from "react";

export default function AudiencePill({ label, icon: Icon }) {
  return (
    <div
      className={[
        "relative w-[520px] max-w-full",
        "rounded-2xl px-8 py-5",
        "flex items-center justify-center",
        "border border-white/15 bg-white/10 backdrop-blur-md",
        "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
      ].join(" ")}
    >
      <span className="absolute left-8 top-1/2 -translate-y-1/2">
        <span className="grid place-items-center h-11 w-11 rounded-xl border border-white/15 bg-white/5">
          <Icon className="h-7 w-7 text-white/90" strokeWidth={1.8} />
        </span>
      </span>

      <span className="text-white text-2xl font-semibold tracking-wide">
        {label}
      </span>

      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
    </div>
  );
}
