import Link from "next/link";

export default function CourseCard({ locale = "th", item }) {
  const title = item?.title_th || item?.title_en || item?.title || "Untitled";
  const short = item?.short_description || item?.short || "";
  const cover = item?.cover_image || item?.cover || "";

  const href = item?.slug ? `/${locale}/courses/${item.slug}` : `/${locale}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="aspect-[16/9] w-full bg-black/20">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={title} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="p-4">
        <div className="text-base font-extrabold text-white line-clamp-2">
          {title}
        </div>
        <div className="mt-1 text-sm text-white/60 line-clamp-2">{short}</div>

        <div className="mt-4 flex gap-2">
          <Link
            href={href}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white hover:bg-white/10"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  );
}
