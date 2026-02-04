// src/app/[locale]/[adminKey]/(admin)/admin/articles/[id]/ArticleEditorClient.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import LexicalEditorClient from "@/components/admin/articles/LexicalEditorClient";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function clean(x) {
  return String(x || "").trim();
}
function splitTags(s) {
  return clean(s)
    .split(",")
    .map((x) => clean(x))
    .filter(Boolean);
}
function joinTags(arr) {
  return (Array.isArray(arr) ? arr : []).join(", ");
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

/** รองรับทั้ง schema ใหม่ (media.*) และ legacy (video/audio) */
function pickYoutubeUrl(it) {
  return it?.media?.youtubeUrl || it?.video?.youtubeUrl || "";
}
function pickAudioUrl(it) {
  return it?.media?.audioUrl || it?.audio?.url || "";
}
function pickAudioPublicId(it) {
  return it?.media?.audioPublicId || it?.audio?.publicId || "";
}
function pickTranscript(it) {
  return it?.media?.transcriptText || it?.audio?.transcript || "";
}
function pickAttachments(it) {
  if (Array.isArray(it?.media?.attachments)) return it.media.attachments;
  if (Array.isArray(it?.attachments)) return it.attachments;
  return [];
}

export default function ArticleEditorClient({
  locale = "th",
  adminKey = "",
  id = "",
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [err, setErr] = useState("");

  const [item, setItem] = useState(null);

  // form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [excerpt, setExcerpt] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [category, setCategory] = useState("");

  // kind + media
  const [kind, setKind] = useState("article"); // article | video | audio
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioPublicId, setAudioPublicId] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [attachments, setAttachments] = useState([]); // [{name,url,publicId,bytes,mime}]

  // cover
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPublicId, setCoverPublicId] = useState("");

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");

  // lexical payloads
  const payloadRef = useRef({ json: null, html: "", text: "", toc: [] });

  // ✅ สำคัญ: เก็บ “ค่าฟอร์มล่าสุด” สำหรับ autosave (กัน stale closure)
  const formRef = useRef({});
  useEffect(() => {
    formRef.current = {
      title,
      slug,
      status,
      excerpt,
      tagsText,
      category,
      kind,
      youtubeUrl,
      audioUrl,
      audioPublicId,
      transcriptText,
      attachments,
      coverUrl,
      coverPublicId,
      seoTitle,
      seoDesc,
      ogImageUrl,
    };
  }, [
    title,
    slug,
    status,
    excerpt,
    tagsText,
    category,
    kind,
    youtubeUrl,
    audioUrl,
    audioPublicId,
    transcriptText,
    attachments,
    coverUrl,
    coverPublicId,
    seoTitle,
    seoDesc,
    ogImageUrl,
  ]);

  const dirtyRef = useRef(false);
  const timerRef = useRef(null);

  // upload refs
  const coverFileRef = useRef(null);
  const audioFileRef = useRef(null);
  const attachFileRef = useRef(null);

  function markDirty() {
    dirtyRef.current = true;
    scheduleAutosave();
  }

  function scheduleAutosave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (dirtyRef.current) save("autosave");
    }, 1200);
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Load failed");

      const it = j.item;
      setItem(it);

      setTitle(it.title || "");
      setSlug(it.slug || "");
      setStatus(it.status || "draft");
      setExcerpt(it.excerpt || "");
      setTagsText(joinTags(it.tags));
      setCategory(it.category || "");

      setSeoTitle(it.seo?.metaTitle || "");
      setSeoDesc(it.seo?.metaDescription || "");
      setOgImageUrl(it.seo?.ogImageUrl || "");

      // kind/media (รองรับ legacy)
      setKind(it.kind || "article");
      setYoutubeUrl(pickYoutubeUrl(it));
      setAudioUrl(pickAudioUrl(it));
      setAudioPublicId(pickAudioPublicId(it));
      setTranscriptText(pickTranscript(it));
      setAttachments(pickAttachments(it));

      // cover
      setCoverUrl(it.coverImage?.url || "");
      setCoverPublicId(it.coverImage?.publicId || "");

      payloadRef.current = {
        json: it.contentJson || null,
        html: it.contentHtml || "",
        text: it.contentText || "",
        toc: Array.isArray(it.toc) ? it.toc : [],
      };

      dirtyRef.current = false;
    } catch (e) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const publicUrl = useMemo(() => {
    const s = clean(slug);
    if (!s) return "";
    return `/${locale}/blog/${s}`;
  }, [locale, slug]);

  async function save(mode = "manual") {
    setSaving(true);
    setSaveNote(mode === "autosave" ? "Autosaving..." : "Saving...");
    setErr("");
    try {
      // ✅ อ่านค่าล่าสุดจาก ref (กัน stale closure)
      const f = formRef.current || {};

      const body = {
        locale,
        title: f.title,
        slug: f.slug,
        status: f.status,
        excerpt: f.excerpt,
        tags: splitTags(f.tagsText),
        category: f.category,

        coverImage: {
          url: f.coverUrl,
          publicId: f.coverPublicId,
          alt: "",
          caption: "",
        },

        // ✅ ส่งทั้ง media (ใหม่) + video/audio (legacy) เพื่อให้ API ฝั่งไหนก็รับได้
        kind: f.kind,
        media: {
          youtubeUrl: f.youtubeUrl,
          audioUrl: f.audioUrl,
          audioPublicId: f.audioPublicId,
          transcriptText: f.transcriptText,
          attachments: Array.isArray(f.attachments) ? f.attachments : [],
        },
        video: { youtubeUrl: f.youtubeUrl },
        audio: {
          url: f.audioUrl,
          publicId: f.audioPublicId,
          transcript: f.transcriptText,
        },
        attachments: Array.isArray(f.attachments) ? f.attachments : [],

        seo: {
          metaTitle: f.seoTitle,
          metaDescription: f.seoDesc,
          ogImageUrl: f.ogImageUrl,
        },

        contentJson: payloadRef.current.json,
        contentHtml: payloadRef.current.html,
        contentText: payloadRef.current.text,
        toc: payloadRef.current.toc,
      };

      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Save failed");

      const saved = j.item;
      setItem(saved);
      setSlug(saved.slug || f.slug);

      // sync back (รองรับ legacy)
      setKind(saved.kind || "article");
      setYoutubeUrl(pickYoutubeUrl(saved));
      setAudioUrl(pickAudioUrl(saved));
      setAudioPublicId(pickAudioPublicId(saved));
      setTranscriptText(pickTranscript(saved));
      setAttachments(pickAttachments(saved));

      setCoverUrl(saved.coverImage?.url || "");
      setCoverPublicId(saved.coverImage?.publicId || "");

      dirtyRef.current = false;
      setSaveNote(mode === "autosave" ? "Autosaved" : "Saved");
      setTimeout(() => setSaveNote(""), 1200);
    } catch (e) {
      setErr(e?.message || "Error");
      setSaveNote("");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImageToCover(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/uploads/image", {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    if (!j?.ok) throw new Error(j?.error || "Upload failed");
    return j.asset; // {url, publicId, width, height}
  }

  async function uploadAdminFile(file, uploadKind) {
    const fd = new FormData();
    fd.append("file", file);
    const qs = new URLSearchParams();
    if (uploadKind) qs.set("kind", uploadKind); // "audio" | "file"
    qs.set("folder", "articles");
    const res = await fetch(`/api/admin/uploads/file?${qs.toString()}`, {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    if (!j?.ok) throw new Error(j?.error || "Upload failed");
    return j.asset; // {url, publicId, bytes, mime, name}
  }

  async function onPickCoverFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const asset = await uploadImageToCover(f);
      setCoverUrl(asset.url || "");
      setCoverPublicId(asset.publicId || "");
      markDirty();
    } catch (ex) {
      alert(ex?.message || "Upload error");
    }
  }

  async function onPickAudioFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const asset = await uploadAdminFile(f, "audio");
      setAudioUrl(asset.url || "");
      setAudioPublicId(asset.publicId || "");
      markDirty();
    } catch (ex) {
      alert(ex?.message || "Upload error");
    }
  }

  async function onPickAttachments(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    try {
      for (const f of files) {
        const asset = await uploadAdminFile(f, "file");
        setAttachments((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          {
            name: asset.name || f.name || "file",
            url: asset.url || "",
            publicId: asset.publicId || "",
            bytes: asset.bytes || f.size || 0,
            mime: asset.mime || f.type || "",
          },
        ]);
      }
      markDirty();
    } catch (ex) {
      alert(ex?.message || "Upload error");
    }
  }

  function removeAttachment(idx) {
    setAttachments((prev) =>
      Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : [],
    );
    markDirty();
  }

  function onChangeKind(v) {
    const next = v === "video" || v === "audio" ? v : "article";
    setKind(next);

    // UX: เวลาเปลี่ยน type ให้เคลียร์ field ที่ไม่เกี่ยว
    if (next !== "video") setYoutubeUrl("");
    if (next !== "audio") {
      setAudioUrl("");
      setAudioPublicId("");
      setTranscriptText("");
    }
    markDirty();
  }

  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;

  if (err && !item) {
    return (
      <div className="p-6">
        <div className="text-rose-300">{err}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Article Editor</div>
          <h1 className="text-xl font-semibold text-slate-100">
            {title || "(no title)"}
          </h1>
          <div className="mt-1 text-sm text-slate-400">
            {item?.readMins ? `${item.readMins} min read` : ""}
            {saveNote ? ` • ${saveNote}` : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save("manual")}
            className="rounded-xl bg-sky-400/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            Save
          </button>
          {publicUrl ? (
            <Link
              href={publicUrl}
              target="_blank"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15"
            >
              Open public
            </Link>
          ) : null}
          <Link
            href={`/${locale}/${adminKey}/admin/articles`}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Back
          </Link>
        </div>
      </div>

      {err ? <div className="text-sm text-rose-300">{err}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="block text-sm text-slate-300">Title</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
            />
          </div>

          <LexicalEditorClient
            initialJson={payloadRef.current.json}
            onChangePayload={(p) => {
              payloadRef.current = p;
              markDirty();
            }}
            onAddAttachment={(asset) => {
              // asset: {url, publicId, bytes, mime, name}
              setAttachments((prev) => {
                const next = Array.isArray(prev) ? [...prev] : [];
                const url = String(asset?.url || "").trim();
                if (!url) return next;
                const dup = next.some(
                  (x) =>
                    (x?.publicId && x.publicId === asset.publicId) ||
                    x?.url === url,
                );
                if (!dup) {
                  next.push({
                    name: asset.name || "file",
                    url,
                    publicId: asset.publicId || "",
                    bytes: asset.bytes || 0,
                    mime: asset.mime || "",
                  });
                }
                return next;
              });
              markDirty();
            }}
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div>
              <label className="block text-sm text-slate-300">Slug</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  markDirty();
                }}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />
              <div className="mt-1 text-xs text-slate-400">
                Public: {publicUrl || "-"}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm text-slate-300">Type</label>
              <select
                value={kind}
                onChange={(e) => onChangeKind(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              >
                <option value="article">
                  {locale === "en" ? "Article" : "บทความทั่วไป"}
                </option>
                <option value="video">
                  {locale === "en" ? "Video article" : "บทความวิดีโอ"}
                </option>
                <option value="audio">
                  {locale === "en" ? "Audio article" : "บทความเสียง"}
                </option>
              </select>
              <div className="mt-1 text-xs text-slate-400">
                {locale === "en"
                  ? "Choose type for Video/Audio fields"
                  : "เลือกประเภทเพื่อเปิดฟิลด์ Video/Audio"}
              </div>
            </div>

            {/* Video */}
            {kind === "video" ? (
              <div>
                <label className="block text-sm text-slate-300">
                  YouTube URL
                </label>
                <input
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    markDirty();
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
                />
              </div>
            ) : null}

            {/* Audio */}
            {kind === "audio" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm text-slate-300">Audio</label>

                  <input
                    ref={audioFileRef}
                    type="file"
                    accept="audio/*"
                    onChange={onPickAudioFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => audioFileRef.current?.click()}
                    className="rounded-xl bg-sky-400/15 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-400/25"
                  >
                    Upload audio
                  </button>
                </div>

                {audioUrl ? (
                  <audio controls src={audioUrl} className="w-full" />
                ) : (
                  <div className="text-xs text-slate-400">
                    ยังไม่มีไฟล์เสียง
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-300">
                    {locale === "en" ? "Transcript" : "ถอดเสียง (Transcript)"}
                  </label>
                  <textarea
                    value={transcriptText}
                    onChange={(e) => {
                      setTranscriptText(e.target.value);
                      markDirty();
                    }}
                    rows={6}
                    className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
                    placeholder={
                      locale === "en"
                        ? "Paste transcript..."
                        : "วางข้อความถอดเสียง..."
                    }
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-sm text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  markDirty();
                }}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
              <div className="mt-1 text-xs text-slate-400">
                ตั้งเป็น published จะใส่ publishedAt อัตโนมัติ
              </div>
            </div>

            {/* Cover */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm text-slate-300">Cover</label>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickCoverFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  className="rounded-xl bg-sky-400/15 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-400/25"
                >
                  Upload cover
                </button>
              </div>

              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="cover"
                  className="h-36 w-full rounded-xl object-cover ring-1 ring-white/10"
                  loading="lazy"
                />
              ) : (
                <div className="h-28 w-full rounded-xl bg-slate-950 ring-1 ring-white/10 flex items-center justify-center text-xs text-slate-400">
                  No cover
                </div>
              )}

              <input
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  markDirty();
                }}
                placeholder="https://..."
                className="h-10 w-full rounded-xl bg-slate-950 px-3 text-xs text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />

              {coverUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setCoverUrl("");
                    setCoverPublicId("");
                    markDirty();
                  }}
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                >
                  Remove cover
                </button>
              ) : null}
            </div>

            <div>
              <label className="block text-sm text-slate-300">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                rows={4}
                className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">
                Tags (comma)
              </label>
              <input
                value={tagsText}
                onChange={(e) => {
                  setTagsText(e.target.value);
                  markDirty();
                }}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
                placeholder="security, devsecops, ..."
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Category</label>
              <input
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                }}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-200">
                {locale === "en" ? "Downloads" : "ไฟล์ดาวน์โหลด"}
              </div>

              <input
                ref={attachFileRef}
                type="file"
                multiple
                onChange={onPickAttachments}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => attachFileRef.current?.click()}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/15"
              >
                {locale === "en" ? "Upload files" : "อัปโหลดไฟล์"}
              </button>
            </div>

            {attachments.length ? (
              <div className="space-y-2">
                {attachments.map((a, idx) => (
                  <div
                    key={`${a.publicId || a.url}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 px-3 py-2 ring-1 ring-white/10"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-100 truncate">
                        {a.name || "file"}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {a.mime || ""}{" "}
                        {a.bytes ? `• ${formatBytes(a.bytes)}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-100 hover:bg-white/15"
                        >
                          Open
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="rounded-lg bg-rose-500/15 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/25"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                {locale === "en" ? "No files" : "ยังไม่มีไฟล์แนบ"}
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-sm font-medium text-slate-200">SEO</div>

            <div>
              <label className="block text-sm text-slate-300">Meta title</label>
              <input
                value={seoTitle}
                onChange={(e) => {
                  setSeoTitle(e.target.value);
                  markDirty();
                }}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">
                Meta description
              </label>
              <textarea
                value={seoDesc}
                onChange={(e) => {
                  setSeoDesc(e.target.value);
                  markDirty();
                }}
                rows={3}
                className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">
                OG image URL
              </label>
              <input
                value={ogImageUrl}
                onChange={(e) => {
                  setOgImageUrl(e.target.value);
                  markDirty();
                }}
                className="mt-2 h-11 w-full rounded-xl bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-white/20"
                placeholder="https://res.cloudinary.com/..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
