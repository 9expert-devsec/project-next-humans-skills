export default function Stepper({ locale = "th", step = 1 }) {
  const labels =
    locale === "en"
      ? ["Information", "Preview", "Done"]
      : ["กรอกข้อมูล", "ตรวจสอบ", "เสร็จสิ้น"];

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.14)",
            background:
              n === step ? "rgba(59,130,246,.18)" : "rgba(26,31,36,.35)",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(255,255,255,.18)",
              background: "rgba(11,28,45,.6)",
            }}
          >
            {n}
          </span>
          {labels[n - 1]}
        </div>
      ))}
    </div>
  );
}
