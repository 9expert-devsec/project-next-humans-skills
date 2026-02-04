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

function normalizeCover(x) {
  if (typeof x === "string") {
    return { url: clean(x), publicId: "", alt: "", caption: "" };
  }
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

function setPath(doc, path, value) {
  // ✅ กัน strict schema ทิ้ง field (สำคัญกับ kind/media)
  try {
    doc.set(path, value, { strict: false });
  } catch {
    // fallback
    doc[path] = value;
  }
}

function buildMediaFromAny(it) {
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

  // ✅ kind/status normalize
  it.kind = normalizeKind(it.kind);
  it.status = normalizeStatus(it.status);

  // ✅ ทำให้ media.* มีเสมอ
  it.media = buildMediaFromAny(it);

  // ✅ คง legacy fields ไว้เผื่อที่อื่นยังใช้
  it.video = {
    youtubeUrl: clean(it?.video?.youtubeUrl || it.media.youtubeUrl),
  };
  it.audio = {
    url: clean(it?.audio?.url || it.media.audioUrl),
    publicId: clean(it?.audio?.publicId || it.media.audioPublicId),
    transcript: clean(it?.audio?.transcript || it.media.transcriptText),
    durationSec: Number(it?.audio?.durationSec) || 0,
  };
  it.attachments = normalizeAttachments(it.attachments || it.media.attachments);

  it.coverImage = normalizeCover(it.coverImage);
  it.seo = normalizeSeo(it.seo);

  // กันเคส key เพี้ยน
  if (it.contentJson == null && it.contentjson != null)
    it.contentJson = it.contentjson;
  if (it.contentHtml == null && it.contenthtml != null)
    it.contentHtml = it.contenthtml;
  if (it.contentText == null && it.contenttext != null)
    it.contentText = it.contenttext;

  return it;
}

/* ---------------- handlers ---------------- */

export async function GET(req, ctx) {
  const p = await ctx.params;
  const id = clean(p?.id);

  await dbConnect();

  let doc = null;
  try {
    doc = await Article.findById(id);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 },
    );
  }

  if (!doc) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item: toItem(doc) });
}

export async function PUT(req, ctx) {
  const p = await ctx.params;
  const id = clean(p?.id);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  await dbConnect();

  let doc = null;
  try {
    doc = await Article.findById(id);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 },
    );
  }

  if (!doc) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  // basic fields
  setPath(doc, "locale", clean(body.locale) || doc.locale || "th");
  setPath(doc, "title", clean(body.title) || "");
  setPath(doc, "slug", clean(body.slug) || "");
  setPath(doc, "excerpt", clean(body.excerpt) || "");
  setPath(doc, "category", clean(body.category) || "");
  setPath(
    doc,
    "tags",
    Array.isArray(body.tags) ? body.tags.map(clean).filter(Boolean) : [],
  );

  const kind = normalizeKind(body.kind || body.type || body.articleType);
  const status = normalizeStatus(body.status);

  // ✅ สำคัญ: เก็บ kind แบบไม่โดน strict ทิ้ง
  setPath(doc, "kind", kind);
  setPath(doc, "status", status);

  // publishedAt policy
  if (status === "published" && !doc.publishedAt) doc.publishedAt = new Date();

  // cover/seo
  setPath(doc, "coverImage", normalizeCover(body.coverImage));
  setPath(doc, "seo", normalizeSeo(body.seo));

  // content
  if (body.contentJson !== undefined)
    setPath(doc, "contentJson", body.contentJson);
  if (body.contentHtml !== undefined)
    setPath(doc, "contentHtml", clean(body.contentHtml));
  if (body.contentText !== undefined)
    setPath(doc, "contentText", clean(body.contentText));
  if (Array.isArray(body.toc)) setPath(doc, "toc", body.toc);

  // ✅ media input: รับทั้งแบบใหม่ (media.*) และ legacy (video/audio/attachments)
  const m = pickObj(body.media) || {};
  const v = pickObj(body.video) || {};
  const a = pickObj(body.audio) || {};

  let youtubeUrl = clean(m.youtubeUrl || v.youtubeUrl || body.youtubeUrl);
  let audioUrl = clean(m.audioUrl || a.url || body.audioUrl);
  let audioPublicId = clean(
    m.audioPublicId || a.publicId || body.audioPublicId,
  );
  let transcriptText = clean(
    m.transcriptText || a.transcript || body.transcriptText,
  );

  const attachments = normalizeAttachments(
    m.attachments || body.attachments || [],
  );

  // enforce by kind
  if (kind !== "video") youtubeUrl = "";
  if (kind !== "audio") {
    audioUrl = "";
    audioPublicId = "";
    transcriptText = "";
  }

  const media = {
    youtubeUrl,
    audioUrl,
    audioPublicId,
    transcriptText,
    attachments,
  };

  // ✅ เก็บลงทั้ง media + legacy เพื่อ compat
  setPath(doc, "media", media);
  setPath(doc, "video", { youtubeUrl });
  setPath(doc, "audio", {
    url: audioUrl,
    publicId: audioPublicId,
    transcript: transcriptText,
    durationSec: Number(doc?.audio?.durationSec) || 0,
  });
  setPath(doc, "attachments", attachments);

  // read mins (fallback)
  const txt = clean(doc.contentText);
  const words = txt ? txt.split(/\s+/).filter(Boolean).length : 0;
  const calcReadMins = words ? Math.max(1, Math.ceil(words / 200)) : 0;
  setPath(doc, "readMins", Number(body.readMins) || calcReadMins);

  await doc.save();

  const saved = await Article.findById(id);
  return NextResponse.json({ ok: true, item: toItem(saved) });
}
