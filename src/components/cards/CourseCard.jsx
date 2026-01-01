import Link from "next/link";
import Image from "next/image";

export default function CourseCard({
  title,
  coverSrc,
  tags = [],
  href = "#",
  glowColor = "59, 130, 246", // ค่า default (น้ำเงิน)
}) {
  return (
    <Link
      href={href}
      className="
        group relative block w-full overflow-hidden rounded-3xl
        bg-white/10 backdrop-blur-xl
        border border-white/15
        shadow-[0_14px_40px_rgba(0,0,0,0.35)]
        transition-transform duration-200 hover:-translate-y-1
      "
    >
      {/* ✅ ขอบสีแบบ glow ตอน hover */}
      <div
        className="
          pointer-events-none absolute inset-0 rounded-3xl
          opacity-0 transition-opacity duration-300
          group-hover:opacity-100
        "
        style={{
          boxShadow: `
            inset 0 0 0 3px rgba(${glowColor}, 0.95),
            0 0 0 3px rgba(${glowColor}, 0.6),
            0 0 60px rgba(${glowColor}, 0.55),
          `,
        }}
      />

      {/* Cover */}
      <div className="relative aspect-video w-full bg-white/10">
        {coverSrc ? (
          <Image src={coverSrc} alt={title} fill className="object-cover" />
        ) : null}
      </div>

      {/* Content */}
      <div className="relative p-5">
        <h3 className="text-white text-lg font-semibold leading-snug">
          {title}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="
                rounded-full px-3 py-1 text-xs
                bg-white/15 text-white/90
                border border-white/10
              "
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
