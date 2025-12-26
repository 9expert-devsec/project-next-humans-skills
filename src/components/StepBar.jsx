// src/components/StepBar.jsx
"use client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function StepIcon({ index, state }) {
  // state: done | active | todo
  const base =
    "grid h-10 w-10 place-items-center rounded-full border text-sm font-extrabold";
  const done = "border-emerald-300/40 bg-emerald-400/15 text-emerald-100";
  const active = "border-white/35 bg-white/10 text-white";
  const todo = "border-white/15 bg-black/10 text-white/55";

  return (
    <div
      className={cx(
        base,
        state === "done" ? done : state === "active" ? active : todo
      )}
    >
      {state === "done" ? "✓" : index}
    </div>
  );
}

export default function StepBar({ current = 1, locale = "th" }) {
  const isEN = locale === "en";

  const steps = [
    { no: 1, title: isEN ? "Register" : "ลงทะเบียน" },
    { no: 2, title: isEN ? "Review" : "ตรวจสอบข้อมูล" },
    { no: 3, title: isEN ? "Done" : "เสร็จสิ้น" },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
      <div className="grid grid-cols-3 items-center gap-3">
        {steps.map((s, i) => {
          const state =
            s.no < current ? "done" : s.no === current ? "active" : "todo";
          const showLineLeft = i !== 0;
          return (
            <div key={s.no} className="relative flex items-center gap-3">
              {/* line */}
              {showLineLeft ? (
                <div
                  className={cx(
                    "absolute left-[-12px] right-[calc(100%-12px)] top-1/2 h-[2px] -translate-y-1/2 rounded",
                    s.no <= current ? "bg-white/25" : "bg-white/10"
                  )}
                />
              ) : null}

              <StepIcon index={s.no} state={state} />
              <div className="min-w-0">
                <div className="text-[11px] font-black tracking-widest text-white/50">
                  STEP {s.no}
                </div>
                <div
                  className={cx(
                    "truncate text-sm font-extrabold",
                    state === "active" ? "text-white" : "text-white/70"
                  )}
                >
                  {s.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
