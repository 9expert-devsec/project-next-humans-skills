"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users, BarChart3, Cpu, Compass } from "lucide-react";

const ICONS = {
  users: Users,
  bar: BarChart3,
  cpu: Cpu,
  compass: Compass,
};

const GLOWS = {
  users: "34, 197, 94",
  bar: "59, 130, 246",
  cpu: "167, 139, 250",
  compass: "251, 191, 36",
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ✅ สร้างดาวหลัง mount เท่านั้น => ไม่เกิด hydration mismatch
function Stars({ count = 10, glowColor = "132, 0, 255" }) {
  const [stars, setStars] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        tx: (Math.random() - 0.5) * 50,
        ty: (Math.random() - 0.5) * 50,
        d: 2.2 + Math.random() * 2.8,
        delay: Math.random() * 0.8,
        size: 3 + Math.random() * 2,
        opacity: 0.25 + Math.random() * 0.55,
      }))
    );
  }, [count]);

  if (!stars) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {stars.map((s, i) => (
        <span
          key={i}
          className="concept-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            ["--tx"]: `${s.tx}px`,
            ["--ty"]: `${s.ty}px`,
            ["--d"]: `${s.d}s`,
            ["--delay"]: `${s.delay}s`,
            ["--glow-color"]: glowColor,
          }}
        />
      ))}
    </div>
  );
}

export default function ConceptPill({
  label,
  icon,
  enableStars = true,
  glowRadius = 240,
}) {
  const ref = useRef(null);
  const rafRef = useRef(null);

  const cur = useRef({ x: 0.5, y: 0.5, a: 0 }); // a = intensity
  const tgt = useRef({ x: 0.5, y: 0.5, a: 0 });

  const Icon = ICONS[icon];
  const glowColor = GLOWS[icon] || "132, 0, 255";

  const write = (xPct, yPct, a) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--glow-x", `${xPct}%`);
    el.style.setProperty("--glow-y", `${yPct}%`);
    el.style.setProperty("--glow-intensity", `${a}`);
    el.style.setProperty("--glow-radius", `${glowRadius}px`);
    el.style.setProperty("--glow-color", glowColor);
  };

  const animate = () => {
    const el = ref.current;
    if (!el) return;

    // smooth ตามแบบ react bits
    cur.current.x = lerp(cur.current.x, tgt.current.x, 0.14);
    cur.current.y = lerp(cur.current.y, tgt.current.y, 0.14);
    cur.current.a = lerp(cur.current.a, tgt.current.a, 0.12);

    write(cur.current.x * 100, cur.current.y * 100, cur.current.a);

    // ถ้า intensity ใกล้ 0 และไม่ได้ hover แล้วค่อยหยุด raf
    if (tgt.current.a === 0 && cur.current.a < 0.01) {
      rafRef.current = null;
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  };

  const start = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(animate);
  };

  const setTargetFromEvent = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    tgt.current.x = clamp(x, 0, 1);
    tgt.current.y = clamp(y, 0, 1);
  };

  useEffect(() => {
    write(50, 50, 0);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={(e) => {
        tgt.current.a = 1;
        setTargetFromEvent(e);
        start();
      }}
      onMouseMove={(e) => {
        setTargetFromEvent(e);
        start();
      }}
      onMouseLeave={() => {
        tgt.current.a = 0;
        tgt.current.x = 0.5;
        tgt.current.y = 0.5;
        start();
      }}
      className="
        concept-pill group relative overflow-hidden
        flex h-[190px] w-[250px] flex-col items-center justify-center gap-2
        rounded-2xl
        bg-white/5 backdrop-blur-xl
        border border-white/10
        shadow-[0_14px_40px_rgba(0,0,0,0.35)]
        transition-transform duration-200 hover:-translate-y-1
      "
      style={{
        ["--glow-x"]: "50%",
        ["--glow-y"]: "50%",
        ["--glow-intensity"]: "0",
        ["--glow-radius"]: `${glowRadius}px`,
        ["--glow-color"]: glowColor,
      }}
    >
      {/* spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
        style={{
          opacity: "var(--glow-intensity)",
          background: `
            radial-gradient(
              var(--glow-radius) circle at var(--glow-x) var(--glow-y),
              rgba(${glowColor}, 0.20) 0%,
              rgba(${glowColor}, 0.10) 22%,
              transparent 60%
            )
          `,
          filter: "blur(12px)",
        }}
      />

      {/* stars */}
      {enableStars && <Stars count={10} glowColor={glowColor} />}

      {/* content */}
      <div className="relative z-30 text-center text-white">
        {Icon && <Icon className="mx-auto h-16 w-16" />}
        <div className="mt-2 text-2xl font-semibold">{label}</div>
      </div>

      {/* ring */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
    </div>
  );
}
