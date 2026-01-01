// src/components/StepBar.jsx
"use client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function StepIcon({ index, state }) {
  // state: done | active | todo
  const base =
    "grid h-10 w-10 place-items-center rounded-full border text-sm font-extrabold";
  const done = "border-emerald-300/50 bg-emerald-400/40 text-emerald-100";
  const active = "border-[#0B1C2C] bg-white text-[#0B1C2C]";
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

export default function StepBar({ current = 1, locale = "th", completed = false }) {
  const isEN = locale === "en";

  const steps = [
    { no: 1, title: isEN ? "Register" : "ลงทะเบียน" },
    { no: 2, title: isEN ? "Review" : "ตรวจสอบข้อมูล" },
    { no: 3, title: isEN ? "Done" : "เสร็จสิ้น" },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
      <div className="grid grid-cols-3 items-center gap-7">
        {steps.map((s, i) => {
          const showLineLeft = i !== 0;

          const isLast = s.no === steps.length;
          const state =
            completed && isLast
              ? "done"
              : s.no < current
              ? "done"
              : s.no === current
              ? "active"
              : "todo";

          const lineDone = completed ? s.no <= steps.length : s.no <= current;

          return (
            <div
              key={s.no}
              className="relative flex items-center justify-center gap-5 flex-col sm:flex-row"
            >
              {showLineLeft ? (
                <div
                  className={cx(
                    "absolute right-full top-1/2 h-[2px] w-5 -translate-y-1/2 rounded sm:w-28",
                    lineDone ? "bg-white/25" : "bg-white/10"
                  )}
                />
              ) : null}

              <StepIcon index={s.no} state={state} />

              <div className="min-w-0">
                <div className="text-base font-extrabold tracking-widest text-white/50 text-center sm:text-left">
                  STEP {s.no}
                </div>
                <div
                  className={cx(
                    "truncate text-base font-bold text-center sm:text-left",
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
    // <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
    //   <div className="grid grid-cols-3 items-center gap-7 ">
    //     {steps.map((s, i) => {
    //       const state =
    //         s.no < current ? "done" : s.no === current ? "active" : "todo";
    //       const showLineLeft = i !== 0;
    //       return (
    //         <div key={s.no} className="relative flex items-center justify-center gap-5  flex-col sm:flex-row ">
    //           {/* line */}
    //           {showLineLeft ? (
    //             <div
    //               className={cx(
    //                 "absolute right-full top-1/2 h-[2px] w-5  -translate-y-1/2 rounded sm:w-28",
    //                 s.no <= current ? "bg-white/25" : "bg-white/10 "
    //               )}
    //             />
    //           ) : null}

    //           <StepIcon index={s.no} state={state} />
    //           <div className="min-w-0">
    //             <div className="text-base font-extrabold tracking-widest text-white/50 text-center sm:text-left">
    //               STEP {s.no}
    //             </div>
    //             <div
    //               className={cx(
    //                 "truncate text-base font-bold text-center sm:text-left",
    //                 state === "active" ? "text-white" : "text-white/70"
    //               )}
    //             >
    //               {s.title}
    //             </div>
    //           </div>
    //         </div>
    //       );
    //     })}
    //   </div>
    // </div>
  );
}
