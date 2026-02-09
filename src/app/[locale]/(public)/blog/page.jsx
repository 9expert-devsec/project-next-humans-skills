import Link from "next/link";
import Image from "next/image";
import { absUrl } from "@/lib/baseUrl.server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Play, Headphones, FileText } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function typeMeta(kind, locale) {
  const isEN = locale === "en";
  if (kind === "video")
    return { label: isEN ? "Video" : "บทความวิดีโอ", Icon: Play };
  if (kind === "audio")
    return { label: isEN ? "Audio" : "บทความเสียง", Icon: Headphones };
  return { label: isEN ? "Article" : "บทความทั่วไป", Icon: FileText };
}

function formatDate(d, locale) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(locale === "en" ? "en-US" : "th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

function getCoverUrl(it) {
  if (!it) return "";
  if (typeof it.coverImage === "string") return it.coverImage;
  if (it.coverImage?.url) return it.coverImage.url;
  if (it.seo?.ogImageUrl) return it.seo.ogImageUrl;
  return "";
}

function ArticleCard({ it, locale }) {
  const { label, Icon } = typeMeta(it.kind, locale);
  const coverUrl = getCoverUrl(it);
  const href = `/${locale}/blog/${it.slug}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:bg-white/[0.05] transition"
    >
      <div className="relative aspect-[16/9] bg-gradient-to-br from-white/10 to-white/0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={it.title || "cover"}
            fill
            className="object-cover opacity-95 group-hover:opacity-100 transition"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/35">
            <span className="text-sm">No cover</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/90 ring-1 ring-white/10 backdrop-blur">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-white/55">
          {it.readMins ? (
            <span>
              {locale === "en"
                ? `${it.readMins} min read`
                : `อ่าน ${it.readMins} นาที`}
            </span>
          ) : null}
          {it.publishedAt ? <span>•</span> : null}
          {it.publishedAt ? (
            <span>{formatDate(it.publishedAt, locale)}</span>
          ) : null}
          {it.category ? <span>•</span> : null}
          {it.category ? (
            <span className="text-white/65">{it.category}</span>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-white">
          {it.title || "-"}
        </h3>

        {it.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/65">
            {it.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";

  const url = await absUrl(`/api/public/articles?locale=${locale}`);
  const res = await fetch(url, { cache: "no-store" });
  const j = await res.json().catch(() => null);

  const items = Array.isArray(j?.items) ? j.items : [];

  return (
    <div className="min-h-screen bg-[#071827]">


      <main className="mx-auto w-full mt-16 max-w-6xl px-6 pb-16 pt-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {locale === "en" ? "Blog" : "บทความ"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {locale === "en"
              ? `${items.length} articles`
              : `${items.length} บทความ`}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <ArticleCard
              key={it._id || it.id || it.slug}
              it={it}
              locale={locale}
            />
          ))}
        </div>
      </main>


    </div>
  );
}
