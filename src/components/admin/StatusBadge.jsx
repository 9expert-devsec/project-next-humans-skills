export default function StatusBadge({ value = "NEW" }) {
  const map = {
    NEW: {
      label: "NEW",
      border: "rgba(246,214,45,.45)",
      bg: "rgba(246,214,45,.12)",
    },
    CONTACTED: {
      label: "CONTACTED",
      border: "rgba(59,130,246,.45)",
      bg: "rgba(59,130,246,.14)",
    },
    QUOTED: {
      label: "QUOTED",
      border: "rgba(0,179,89,.45)",
      bg: "rgba(0,179,89,.14)",
    },
    DONE: {
      label: "DONE",
      border: "rgba(0,179,89,.55)",
      bg: "rgba(0,179,89,.18)",
    },
    CANCELED: {
      label: "CANCELED",
      border: "rgba(255,255,255,.25)",
      bg: "rgba(255,255,255,.08)",
    },
  };

  const s = map[value] || map.NEW;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: "white",
        whiteSpace: "nowrap",
      }}
      title={value}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          background: "rgba(255,255,255,.7)",
        }}
      />
      {s.label}
    </span>
  );
}
