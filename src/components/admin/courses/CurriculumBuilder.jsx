"use client";

import { useMemo } from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

function newDay(dayNum) {
  return {
    day: dayNum,
    title: "",
    sessions: [
      { period: "morning", title: "", partners: [], topics: [], notes: "" },
      { period: "afternoon", title: "", partners: [], topics: [], notes: "" },
    ],
  };
}

function periodLabel(p) {
  if (p === "morning") return "Morning";
  if (p === "afternoon") return "Afternoon";
  return "Evening";
}

/**
 * ✅ normalize รองรับข้อมูลเก่า:
 * - session.partner (string) -> session.partners (array)
 * - ถ้าไม่มี partners ให้ default เป็น []
 */
function normalizeDays(rawDays) {
  const days = Array.isArray(rawDays) ? rawDays : [];
  return days.map((d, di) => {
    const sessions = Array.isArray(d?.sessions) ? d.sessions : [];
    const normSessions = sessions.map((s) => {
      const legacyPartner = String(s?.partner || "").trim();
      const partners = Array.isArray(s?.partners)
        ? s.partners.map((x) => String(x || "").trim()).filter(Boolean)
        : legacyPartner
        ? [legacyPartner]
        : [];
      const next = {
        ...s,
        partners,
      };
      // ไม่จำเป็นต้องลบ partner ทิ้ง แต่จะไม่ใช้งานแล้ว
      return next;
    });

    return {
      ...d,
      day: Number(d?.day || di + 1),
      title: String(d?.title || ""),
      sessions: normSessions,
    };
  });
}

export default function CurriculumBuilder({
  value = [],
  onChange,
  partners = [],
}) {
  // ✅ ใช้ normalized data เพื่อรองรับข้อมูลเก่า
  const days = useMemo(() => normalizeDays(value), [value]);

  const nextDayNumber = useMemo(() => {
    const max = days.reduce((m, d) => Math.max(m, Number(d?.day || 0)), 0);
    return max + 1;
  }, [days]);

  function commit(next) {
    onChange?.(next);
  }

  function setDay(idx, patch) {
    const next = days.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    commit(next);
  }

  function addDay() {
    commit([...days, newDay(nextDayNumber)]);
  }

  function removeDay(idx) {
    const next = days
      .filter((_, i) => i !== idx)
      .map((d, i) => ({ ...d, day: i + 1 }));
    commit(next);
  }

  function addSession(dayIdx) {
    const next = days.map((x, i) =>
      i === dayIdx
        ? {
            ...x,
            sessions: [
              ...(x.sessions || []),
              {
                period: "evening",
                title: "",
                partners: [],
                topics: [],
                notes: "",
              },
            ],
          }
        : x
    );
    commit(next);
  }

  function removeSession(dayIdx, sessionIdx) {
    const next = days.map((d, i) => {
      if (i !== dayIdx) return d;
      const sessions = (d.sessions || []).filter((_, si) => si !== sessionIdx);
      return { ...d, sessions };
    });
    commit(next);
  }

  function setSession(dayIdx, sessionIdx, patch) {
    const next = days.map((d, i) => {
      if (i !== dayIdx) return d;
      const sessions = (d.sessions || []).map((s, si) =>
        si === sessionIdx ? { ...s, ...patch } : s
      );
      return { ...d, sessions };
    });
    commit(next);
  }

  function setTopicsFromText(dayIdx, sessionIdx, text) {
    const topics = String(text || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    setSession(dayIdx, sessionIdx, { topics });
  }

  function toggleSessionPartner(dayIdx, sessionIdx, k) {
    const s = days?.[dayIdx]?.sessions?.[sessionIdx];
    const current = safeArr(s?.partners);
    const has = current.includes(k);
    const nextPartners = has ? current.filter((x) => x !== k) : [...current, k];
    setSession(dayIdx, sessionIdx, { partners: nextPartners });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-extrabold text-white">
            Curriculum Builder
          </div>
          <div className="mt-1 text-xs text-white/60">
            เพิ่มวัน/ช่วง/หัวข้อ (รองรับหลาย Partner ต่อ session ✅)
          </div>
        </div>

        <button
          type="button"
          onClick={addDay}
          className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white/90"
        >
          + Add Day
        </button>
      </div>

      {days.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/60">
          ยังไม่มี curriculum — กด “Add Day”
        </div>
      ) : null}

      <div className="grid gap-4">
        {days.map((d, dayIdx) => (
          <div
            key={dayIdx}
            className="rounded-3xl border border-white/10 bg-black/15 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[260px] flex-1">
                <div className="text-xs font-extrabold text-white/70">
                  Day {d.day}
                </div>
                <input
                  value={d.title || ""}
                  onChange={(e) => setDay(dayIdx, { title: e.target.value })}
                  placeholder="Day title เช่น The Power of AI and Leadership Transformation"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addSession(dayIdx)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/10 hover:bg-white/15"
                >
                  + Add Session
                </button>
                <button
                  type="button"
                  onClick={() => removeDay(dayIdx)}
                  className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-extrabold text-rose-200 ring-1 ring-rose-500/30 hover:bg-rose-500/20"
                >
                  Remove Day
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {(d.sessions || []).map((s, sessionIdx) => (
                <div
                  key={sessionIdx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={s.period || "morning"}
                        onChange={(e) =>
                          setSession(dayIdx, sessionIdx, {
                            period: e.target.value,
                          })
                        }
                        className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-extrabold text-white outline-none"
                      >
                        <option value="morning" className="bg-slate-900">
                          Morning
                        </option>
                        <option value="afternoon" className="bg-slate-900">
                          Afternoon
                        </option>
                        <option value="evening" className="bg-slate-900">
                          Evening
                        </option>
                      </select>

                      <div className="text-xs font-extrabold text-white/60">
                        {periodLabel(s.period || "morning")}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSession(dayIdx, sessionIdx)}
                      className="rounded-xl bg-white/5 px-3 py-2 text-xs font-extrabold text-white/70 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <div className="mb-2 text-xs font-extrabold text-white/70">
                        Session Title
                      </div>
                      <input
                        value={s.title || ""}
                        onChange={(e) =>
                          setSession(dayIdx, sessionIdx, {
                            title: e.target.value,
                          })
                        }
                        placeholder='เช่น "Leading Change & Visionary Leadership in the Digital Era"'
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                      />
                    </div>

                    {/* ✅ Partner multi */}
                    <div>
                      <div className="mb-2 text-xs font-extrabold text-white/70">
                        Partner (เลือกได้หลายอัน)
                      </div>

                      <div className="w-full rounded-2xl border border-white/10 bg-black/25 p-3">
                        <div className="flex flex-wrap gap-2">
                          {partners.length === 0 ? (
                            <div className="text-xs text-white/50">-</div>
                          ) : (
                            partners.map((p) => {
                              const active = safeArr(s.partners).includes(p);
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() =>
                                    toggleSessionPartner(dayIdx, sessionIdx, p)
                                  }
                                  className={cx(
                                    "rounded-full px-3 py-2 text-xs font-extrabold ring-1",
                                    active
                                      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                                      : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                                  )}
                                  title="คลิกเพื่อเลือก/ยกเลิก"
                                >
                                  {p}
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div className="mt-2 text-[11px] text-white/45">
                          เลือกแล้ว:{" "}
                          {safeArr(s.partners).length
                            ? safeArr(s.partners).join(", ")
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-xs font-extrabold text-white/70">
                        Topics (บรรทัดละ 1 ข้อ)
                      </div>
                      <textarea
                        rows={6}
                        value={
                          Array.isArray(s.topics) ? s.topics.join("\n") : ""
                        }
                        onChange={(e) =>
                          setTopicsFromText(dayIdx, sessionIdx, e.target.value)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                      />
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-extrabold text-white/70">
                        Notes (optional)
                      </div>
                      <textarea
                        rows={6}
                        value={s.notes || ""}
                        onChange={(e) =>
                          setSession(dayIdx, sessionIdx, {
                            notes: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
