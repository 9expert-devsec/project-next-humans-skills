// src/components/admin/courses/CurriculumBuilder.jsx
"use client";

import { useMemo } from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

function cleanStr(x) {
  return String(x ?? "").trim();
}

function newDay(dayNum) {
  return {
    day: dayNum,
    title: "",
    sessions: [
      {
        period: "morning",
        title: "",
        partners: [],
        topics: [], // legacy
        topic_groups: [], // new
        notes: "",
      },
      {
        period: "afternoon",
        title: "",
        partners: [],
        topics: [],
        topic_groups: [],
        notes: "",
      },
    ],
  };
}

function periodLabel(p) {
  if (p === "morning") return "Morning";
  if (p === "afternoon") return "Afternoon";
  return "Evening";
}

/**
 * ✅ Editor normalize:
 * - ห้าม filter ค่าว่างทิ้ง (เพื่อไม่ให้ Add Group/Item หาย)
 * - ยอมรับ legacy:
 *   - session.partner (string) -> partners[]
 * - partners ใน state จะเป็น array of "keys" เสมอ (bitkub/9expert/key)
 */
function normalizeDays(rawDays) {
  const days = Array.isArray(rawDays) ? rawDays : [];

  return days.map((d, di) => {
    const sessions = Array.isArray(d?.sessions) ? d.sessions : [];

    const normSessions = sessions.map((s) => {
      const legacyPartner = cleanStr(s?.partner);

      const partners = Array.isArray(s?.partners)
        ? s.partners.map((x) => cleanStr(x)).filter(Boolean)
        : legacyPartner
        ? [legacyPartner]
        : [];

      const topic_groups = Array.isArray(s?.topic_groups)
        ? s.topic_groups.map((g) => {
            const title = String(g?.title ?? "");
            const itemsRaw = Array.isArray(g?.items) ? g.items : [];
            const items = itemsRaw.map((x) => String(x ?? ""));
            return { title, items: items.length ? items : [""] };
          })
        : [];

      const topics = Array.isArray(s?.topics)
        ? s.topics.map((x) => String(x ?? ""))
        : [];

      return { ...s, partners, topics, topic_groups };
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
  const days = useMemo(() => normalizeDays(value), [value]);

  // ✅ partners prop รองรับ 2 แบบ:
  // 1) ["bitkub","9expert","key"]
  // 2) [{key:"bitkub",label:"Bitkub Academy"}, ...]
  const partnerOptions = useMemo(() => {
    const arr = Array.isArray(partners) ? partners : [];
    if (arr.length === 0) return [];
    if (typeof arr[0] === "string") {
      return arr.map((k) => ({ key: String(k), label: String(k) }));
    }
    return arr
      .map((p) => ({
        key: cleanStr(p?.key),
        label: cleanStr(p?.label) || cleanStr(p?.key),
      }))
      .filter((p) => p.key);
  }, [partners]);

  const labelByKey = useMemo(() => {
    const m = new Map();
    for (const p of partnerOptions) m.set(p.key, p.label);
    return m;
  }, [partnerOptions]);

  const nextDayNumber = useMemo(() => {
    const max = days.reduce((m, d) => Math.max(m, Number(d?.day || 0)), 0);
    return max + 1;
  }, [days]);

  function commit(next) {
    onChange?.(next);
  }

  function setDay(idx, patch) {
    commit(days.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function addDay() {
    commit([...days, newDay(nextDayNumber)]);
  }

  function removeDay(idx) {
    commit(
      days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }))
    );
  }

  function addSession(dayIdx) {
    commit(
      days.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              sessions: [
                ...(d.sessions || []),
                {
                  period: "evening",
                  title: "",
                  partners: [],
                  topics: [],
                  topic_groups: [],
                  notes: "",
                },
              ],
            }
          : d
      )
    );
  }

  function removeSession(dayIdx, sessionIdx) {
    commit(
      days.map((d, i) =>
        i === dayIdx
          ? { ...d, sessions: d.sessions.filter((_, si) => si !== sessionIdx) }
          : d
      )
    );
  }

  function setSession(dayIdx, sessionIdx, patch) {
    commit(
      days.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              sessions: d.sessions.map((s, si) =>
                si === sessionIdx ? { ...s, ...patch } : s
              ),
            }
          : d
      )
    );
  }

  /* ---------------- partner helpers ---------------- */

  function toggleSessionPartner(dayIdx, sessionIdx, key) {
    const s = days?.[dayIdx]?.sessions?.[sessionIdx];
    const cur = safeArr(s?.partners).map(cleanStr).filter(Boolean);
    const has = cur.includes(key);
    const next = has ? cur.filter((x) => x !== key) : [...cur, key];
    setSession(dayIdx, sessionIdx, { partners: next });
  }

  /* ---------------- topic groups helpers ---------------- */

  function addGroup(dayIdx, sessionIdx) {
    const s = days[dayIdx].sessions[sessionIdx];
    setSession(dayIdx, sessionIdx, {
      topic_groups: [...safeArr(s.topic_groups), { title: "", items: [""] }],
    });
  }

  function removeGroup(dayIdx, sessionIdx, groupIdx) {
    const s = days[dayIdx].sessions[sessionIdx];
    setSession(dayIdx, sessionIdx, {
      topic_groups: safeArr(s.topic_groups).filter((_, i) => i !== groupIdx),
    });
  }

  function setGroupTitle(dayIdx, sessionIdx, groupIdx, title) {
    const s = days[dayIdx].sessions[sessionIdx];
    setSession(dayIdx, sessionIdx, {
      topic_groups: safeArr(s.topic_groups).map((g, i) =>
        i === groupIdx ? { ...g, title } : g
      ),
    });
  }

  function addGroupItem(dayIdx, sessionIdx, groupIdx) {
    const s = days[dayIdx].sessions[sessionIdx];
    setSession(dayIdx, sessionIdx, {
      topic_groups: safeArr(s.topic_groups).map((g, i) =>
        i === groupIdx ? { ...g, items: [...safeArr(g.items), ""] } : g
      ),
    });
  }

  function setGroupItem(dayIdx, sessionIdx, groupIdx, itemIdx, text) {
    const s = days[dayIdx].sessions[sessionIdx];
    setSession(dayIdx, sessionIdx, {
      topic_groups: safeArr(s.topic_groups).map((g, i) => {
        if (i !== groupIdx) return g;
        const items = [...safeArr(g.items)];
        items[itemIdx] = text;
        return { ...g, items };
      }),
    });
  }

  function removeGroupItem(dayIdx, sessionIdx, groupIdx, itemIdx) {
    const s = days[dayIdx].sessions[sessionIdx];
    setSession(dayIdx, sessionIdx, {
      topic_groups: safeArr(s.topic_groups).map((g, i) => {
        if (i !== groupIdx) return g;
        const items = safeArr(g.items);
        const nextItems = items.filter((_, ii) => ii !== itemIdx);
        return { ...g, items: nextItems.length ? nextItems : [""] };
      }),
    });
  }

  /* ---------------- render ---------------- */

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold text-white">
            Curriculum Builder
          </div>
          <div className="mt-1 text-xs text-white/60">
            รองรับหัวข้อหลัก + หัวข้อย่อย (Topic Groups) ✅
          </div>
        </div>

        <button
          type="button"
          onClick={addDay}
          className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900"
        >
          + Add Day
        </button>
      </div>

      {days.map((d, dayIdx) => (
        <div
          key={dayIdx}
          className="rounded-3xl border border-white/10 bg-black/15 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <input
              value={d.title}
              onChange={(e) => setDay(dayIdx, { title: e.target.value })}
              placeholder={`Day ${d.day} title`}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
            />

            <button
              type="button"
              onClick={() => removeDay(dayIdx)}
              className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-extrabold text-rose-200"
            >
              Remove Day
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {d.sessions.map((s, sessionIdx) => (
              <div
                key={sessionIdx}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-white/60">
                    {periodLabel(s.period)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSession(dayIdx, sessionIdx)}
                    className="text-xs text-white/50"
                  >
                    Remove
                  </button>
                </div>

                <input
                  value={s.title}
                  onChange={(e) =>
                    setSession(dayIdx, sessionIdx, { title: e.target.value })
                  }
                  placeholder="Session title"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-2 text-white outline-none"
                />

                {/* ✅ Partner chips (แสดงชื่อเต็ม แต่เก็บเป็น key) */}
                <div className="mt-3">
                  <div className="mb-2 text-xs font-extrabold text-white/70">
                    Partner (เลือกได้หลายอัน)
                  </div>

                  <div className="w-full rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="flex flex-wrap gap-2">
                      {partnerOptions.length === 0 ? (
                        <div className="text-xs text-white/50">-</div>
                      ) : (
                        partnerOptions.map((p) => {
                          const active = safeArr(s.partners).includes(p.key);
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() =>
                                toggleSessionPartner(dayIdx, sessionIdx, p.key)
                              }
                              className={cx(
                                "rounded-full px-3 py-2 text-xs font-extrabold ring-1",
                                active
                                  ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                                  : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10"
                              )}
                              title="คลิกเพื่อเลือก/ยกเลิก"
                            >
                              {p.label}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-white/45">
                      เลือกแล้ว:{" "}
                      {safeArr(s.partners).length
                        ? safeArr(s.partners)
                            .map((k) => labelByKey.get(k) || k)
                            .join(", ")
                        : "-"}
                    </div>
                  </div>
                </div>

                {/* Topic Groups */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-white">
                      Topics (Groups)
                    </div>
                    <button
                      type="button"
                      onClick={() => addGroup(dayIdx, sessionIdx)}
                      className="rounded-xl bg-white px-3 py-1 text-xs font-extrabold text-slate-900"
                    >
                      + Add Group
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {safeArr(s.topic_groups).map((g, gi) => (
                      <div
                        key={gi}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <input
                          value={g.title}
                          onChange={(e) =>
                            setGroupTitle(
                              dayIdx,
                              sessionIdx,
                              gi,
                              e.target.value
                            )
                          }
                          placeholder="Group title"
                          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none"
                        />

                        <div className="mt-2 grid gap-2">
                          {safeArr(g.items).map((it, ii) => (
                            <div key={ii} className="flex gap-2">
                              <input
                                value={it}
                                onChange={(e) =>
                                  setGroupItem(
                                    dayIdx,
                                    sessionIdx,
                                    gi,
                                    ii,
                                    e.target.value
                                  )
                                }
                                className="flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeGroupItem(dayIdx, sessionIdx, gi, ii)
                                }
                                className="text-xs text-rose-300"
                              >
                                ลบ
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => addGroupItem(dayIdx, sessionIdx, gi)}
                            className="text-xs text-white/70"
                          >
                            + Add item
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGroup(dayIdx, sessionIdx, gi)}
                            className="text-xs text-rose-300"
                          >
                            Remove group
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addSession(dayIdx)}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-extrabold text-white"
            >
              + Add Session
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
