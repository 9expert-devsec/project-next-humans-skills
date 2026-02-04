// src/app/[locale]/(public)/blog/[slug]/page.jsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { absUrl } from "@/lib/baseUrl.server";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import { toCloudinaryAttachmentUrl } from "@/lib/cloudinaryDownload";

import ArticleContent from "@/components/blog/ArticleContent";
import AudioMiniPlayer from "@/components/blog/AudioMiniPlayer";
import ArticleToc from "@/components/blog/ArticleToc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function normalizeSlugParam(x) {
  const s = clean(x);
  if (!s) return "";
  // กันเคส slug ถูก encode มาแล้ว
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function getCoverUrl(it) {
  if (!it) return "";
  if (typeof it.coverImage === "string") return it.coverImage;
  if (it.coverImage?.url) return it.coverImage.url;
  if (it.seo?.ogImageUrl) return it.seo.ogImageUrl;
  return "";
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

function formatBytes(n) {
  const v = Number(n) || 0;
  if (!v) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = v;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i += 1;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function pickAttachments(it) {
  const a1 = Array.isArray(it?.media?.attachments) ? it.media.attachments : [];
  const a2 = Array.isArray(it?.attachments) ? it.attachments : [];
  const merged = [...a1, ...a2].filter((x) => x && x.url);

  // dedupe by publicId/url
  const seen = new Set();
  return merged.filter((x) => {
    const k = clean(x.publicId) || clean(x.url);
    if (!k) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ให้ filename เป็น ascii (สอดคล้องกับ lib)
function safeDownloadName(filename) {
  const safe = String(filename || "download")
    .trim()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || "download";
}

function downloadHref(a) {
  const url = clean(a?.url);
  if (!url) return "";
  const filename = safeDownloadName(a?.name || "download");
  return toCloudinaryAttachmentUrl(url, filename);
}

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const slug = normalizeSlugParam(p?.slug);

  const url = await absUrl(
    `/api/public/articles/${encodeURIComponent(slug)}?locale=${locale}`,
  );
  const res = await fetch(url, { cache: "no-store" });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.ok || !j?.item) return notFound();

  const it = j.item;

  const coverUrl = getCoverUrl(it);

  const youtubeUrl =
    clean(it?.media?.youtubeUrl) || clean(it?.video?.youtubeUrl);
  const youtubeEmbed = youtubeUrl ? toYouTubeEmbedUrl(youtubeUrl) : "";

  const audioUrl = clean(it?.media?.audioUrl) || clean(it?.audio?.url);
  const transcript =
    clean(it?.media?.transcriptText) || clean(it?.audio?.transcript);

  const attachments = pickAttachments(it);

  return (
    <div className="min-h-screen bg-[#071827]">
      <main className="mx-auto mt-16 w-full max-w-6xl px-6 pb-16 pt-10">
        {/* Breadcrumbs */}
        <div className="mb-6 text-xs text-white/55">
          <Link href={`/${locale}`} className="hover:text-white/80">
            {locale === "en" ? "Home" : "หน้าแรก"}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/blog`} className="hover:text-white/80">
            {locale === "en" ? "Blog" : "บทความ"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">{it.title || "-"}</span>
        </div>

        {/* header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs text-white/55">
            {it.publishedAt ? formatDate(it.publishedAt, locale) : null}
            {it.readMins ? (
              <span>
                {" "}
                •{" "}
                {locale === "en" ? `${it.readMins} min` : `${it.readMins} นาที`}
              </span>
            ) : null}
            {it.category ? <span> • {it.category}</span> : null}
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {it.title}
          </h1>

          {it.excerpt ? (
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/65">
              {it.excerpt}
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
          {/* left column */}
          <div className="min-w-0">
            {coverUrl ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <Image
                  src={coverUrl}
                  alt={it.title || "cover"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            ) : null}

            {/* Video embed */}
            {it.kind === "video" && youtubeEmbed ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={youtubeEmbed}
                    title={it.title || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {/* Audio player */}
            {it.kind === "audio" ? (
              <div className="mt-8 space-y-4">
                {audioUrl ? (
                  <AudioMiniPlayer src={audioUrl} title={it.title} />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                    {locale === "en"
                      ? "Audio file is not attached yet."
                      : "ยังไม่ได้แนบไฟล์เสียง"}
                  </div>
                )}

                {transcript ? (
                  <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-white">
                      {locale === "en" ? "Transcript" : "ถอดเสียง (Transcript)"}
                    </summary>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                      {transcript}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}

            {/* TOC mobile */}
            {Array.isArray(it.toc) && it.toc.length ? (
              <ArticleToc
                items={it.toc}
                locale={locale}
                collapsible
                className="mt-8 lg:hidden"
              />
            ) : null}

            {/* Downloads (✅ ใช้ fl_attachment เพื่อให้ชื่อไฟล์ถูกต้อง) */}
            {attachments.length ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-white">
                  {locale === "en" ? "Downloads" : "ไฟล์ดาวน์โหลด"}
                </div>

                <div className="mt-3 space-y-2">
                  {attachments.map((a, idx) => {
                    const href = downloadHref(a);
                    const dlName = safeDownloadName(a?.name || "download");

                    return (
                      <a
                        key={`${a.publicId || a.url}-${idx}`}
                        href={href || a.url}
                        download={dlName}
                        className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-3 ring-1 ring-white/10 hover:bg-black/30"
                        title={a.name || "download"}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm text-white">
                            {a.name || "file"}
                          </div>
                          <div className="truncate text-xs text-white/55">
                            {a.mime || ""} {a.bytes ? `• ${formatBytes(a.bytes)}` : ""}
                          </div>
                        </div>

                        <span className="text-xs text-sky-200">
                          {locale === "en" ? "Download" : "ดาวน์โหลด"}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* content */}
            <div className="mt-10">
              <ArticleContent html={it.contentHtml} />
            </div>
          </div>

          {/* TOC desktop */}
          <aside className="hidden lg:block">
            {Array.isArray(it.toc) && it.toc.length ? (
              <ArticleToc
                items={it.toc}
                locale={locale}
                className="sticky top-24"
              />
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
