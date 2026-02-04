// src/app/api/public/articles/[slug]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Article from "@/models/Article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */

function clean(x) {
  return String(x || "").trim();
}

function pickObj(x) {
  return x && typeof x === "object" ? x : null;
}

function normalizeLocale(x) {
  return clean(x) === "en" ? "en" : "th";
}

function normalizeKind(x) {
  const v = clean(x);
  if (v === "video" || v === "audio") return v;
  return "article";
}

function normalizeStatus(x) {
  const v = clean(x);
  if (v === "published" || v === "archived") return v;
  return "draft";
}

function safeDecodeURIComponent(s) {
  const raw = clean(s);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function normalizeToForm(s, form) {
  const v = clean(s);
  if (!v) return "";
  try {
    return v.normalize(form);
  } catch {
    return v;
  }
}

function uniqNonEmpty(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const v = clean(x);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/**
 * ✅ สร้าง slug variants เพื่อกันเคส Unicode normalization ไม่ตรง (NFC/NFD)
 * และกันเคสถูก encode มาแล้ว/ยังไม่ decode
 */
function makeSlugVariants(paramSlug) {
  const raw = clean(paramSlug);
  const decoded = safeDecodeURIComponent(raw);

  const nfc = normalizeToForm(decoded, "NFC");
  const nfd = normalizeToForm(decoded, "NFD");

  // บางที param ที่ได้มาอาจเป็น decoded อยู่แล้ว แต่ raw อาจยังมี %xx
  // เลยเก็บทั้ง raw/decoded/NFC/NFD
  return uniqNonEmpty([raw, decoded, nfc, nfd]);
}

function normalizeCover(x) {
  const c = pickObj(x) || {};
  return {
    url: clean(c.url),
    publicId: clean(c.publicId),
    alt: clean(c.alt),
    caption: clean(c.caption),
  };
}

function normalizeSeo(x) {
  const s = pickObj(x) || {};
  return {
    metaTitle: clean(s.metaTitle),
    metaDescription: clean(s.metaDescription),
    ogImageUrl: clean(s.ogImageUrl),
    canonicalUrl: clean(s.canonicalUrl),
  };
}

function normalizeAttachments(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a
    .map((it) => ({
      name: clean(it?.name),
      url: clean(it?.url),
      publicId: clean(it?.publicId),
      bytes: Number(it?.bytes) || 0,
      mime: clean(it?.mime),
    }))
    .filter((x) => x.url);
}

// ทำ output ให้มี media.* เสมอ (หน้า public ใช้)
function buildMedia(it) {
  const media = pickObj(it?.media) || {};
  const legacyVideo = pickObj(it?.video) || {};
  const legacyAudio = pickObj(it?.audio) || {};

  const youtubeUrl = clean(media.youtubeUrl || legacyVideo.youtubeUrl);
  const audioUrl = clean(media.audioUrl || legacyAudio.url);
  const audioPublicId = clean(media.audioPublicId || legacyAudio.publicId);
  const transcriptText = clean(media.transcriptText || legacyAudio.transcript);

  const attachments = normalizeAttachments(
    media.attachments || it?.attachments || [],
  );

  return { youtubeUrl, audioUrl, audioPublicId, transcriptText, attachments };
}

function toItem(doc) {
  const it = doc.toObject({ virtuals: false });
  it.id = String(it._id || "");

  it.kind = normalizeKind(it.kind);
  it.status = normalizeStatus(it.status);

  it.coverImage = normalizeCover(it.coverImage);
  it.seo = normalizeSeo(it.seo);

  // media + legacy compat
  it.media = buildMedia(it);
  it.video = { youtubeUrl: clean(it?.video?.youtubeUrl || it.media.youtubeUrl) };
  it.audio = {
    url: clean(it?.audio?.url || it.media.audioUrl),
    publicId: clean(it?.audio?.publicId || it.media.audioPublicId),
    transcript: clean(it?.audio?.transcript || it.media.transcriptText),
    durationSec: Number(it?.audio?.durationSec) || 0,
  };
  it.attachments = normalizeAttachments(it.attachments || it.media.attachments);

  // กันเคส key เพี้ยน
  if (it.contentJson == null && it.contentjson != null) it.contentJson = it.contentjson;
  if (it.contentHtml == null && it.contenthtml != null) it.contentHtml = it.contenthtml;
  if (it.contentText == null && it.contenttext != null) it.contentText = it.contenttext;

  return it;
}

/* ---------------- GET ---------------- */

export async function GET(req, ctx) {
  const p = await ctx.params;

  const slugParam = p?.slug; // อาจเป็น decoded แล้ว
  const slugVariants = makeSlugVariants(slugParam);

  const { searchParams } = new URL(req.url);
  const locale = normalizeLocale(searchParams.get("locale"));

  if (!slugVariants.length) {
    return NextResponse.json(
      { ok: false, error: "Missing slug" },
      { status: 400 },
    );
  }

  await dbConnect();

  const now = new Date();

  const baseFilter = {
    status: "published",
    $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
  };

  // 1) พยายามหาแบบตรง locale ก่อน
  let doc = await Article.findOne({
    ...baseFilter,
    locale,
    slug: { $in: slugVariants },
  });

  // 2) fallback: ถ้า locale ใน DB เพี้ยน/ว่าง/ผิด ให้หาโดยไม่ล็อก locale
  if (!doc) {
    doc = await Article.findOne({
      ...baseFilter,
      slug: { $in: slugVariants },
    });
  }

  if (!doc) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item: toItem(doc) });
}
