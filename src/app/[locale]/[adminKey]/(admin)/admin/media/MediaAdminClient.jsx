"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import imageCompression from "browser-image-compression";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts).catch(() => null);
  const data = await res?.json().catch(() => ({}));
  if (!res || !res.ok || data?.ok === false) {
    throw new Error(data?.message || data?.error || "Request failed");
  }
  return data;
}

async function compressImage(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  return await imageCompression(file, options);
}

function toDateInputValue(d) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/* ---------------- Sortable Row ---------------- */
function SortableRow({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        className={cx(
          "absolute left-3 top-3 z-10 rounded-xl border border-white/10",
          "bg-black/40 p-2 text-white hover:bg-black/60",
          isDragging && "bg-black/70"
        )}
        {...attributes}
        {...listeners}
        aria-label="Drag handle"
        title="ลากเพื่อจัดลำดับ"
      >
        <GripVertical size={18} />
      </button>

      {children}
    </div>
  );
}

export default function MediaAdminClient({ locale = "th" }) {
  const isEN = locale === "en";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [publishedAt, setPublishedAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [readMins, setReadMins] = useState(5);

  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");

  const ids = useMemo(() => items.map((x) => x._id), [items]);

  async function load() {
    setLoading(true);
    try {
      const data = await jsonFetch(
        `/api/admin/media?locale=${encodeURIComponent(locale)}`,
        { cache: "no-store" }
      );
      setItems(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function uploadToCloudinary(f) {
    const sig = await jsonFetch("/api/admin/media/signature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folder: "next-humans/media" }),
    });

    const form = new FormData();
    form.append("file", f);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("signature", sig.signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
    const res = await fetch(uploadUrl, { method: "POST", body: form }).catch(
      () => null
    );
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok)
      throw new Error(data?.error?.message || "Upload failed");

    return { imageUrl: data.secure_url, imagePublicId: data.public_id };
  }

  async function onCreate(e) {
    e.preventDefault();
    if (busy) return;

    if (!file) {
      alert(isEN ? "Please choose an image" : "กรุณาเลือกรูป");
      return;
    }

    const HARD_LIMIT_MB = 30;
    if (file.size > HARD_LIMIT_MB * 1024 * 1024) {
      alert(
        isEN
          ? `File too large (>${HARD_LIMIT_MB}MB). Please resize first.`
          : `ไฟล์ใหญ่เกิน ${HARD_LIMIT_MB}MB กรุณาย่อรูปก่อน`
      );
      return;
    }

    try {
      setBusy(true);

      // 1) compress ถ้า > 1MB
      let uploadFile = file;
      if (file.size > 1024 * 1024) {
        setBusyMsg(isEN ? "Compressing image..." : "กำลังบีบอัดรูป...");
        uploadFile = await compressImage(file);
      }

      // 2) กันชน 10MB Cloudinary
      const SAFE_MB = 9.5;
      if (uploadFile.size > SAFE_MB * 1024 * 1024) {
        alert(
          isEN
            ? "Image is still too large after compression. Please resize/crop and try again."
            : "รูปยังใหญ่เกินหลังบีบอัด กรุณาย่อ/ครอป แล้วลองใหม่"
        );
        return;
      }

      // 3) upload
      setBusyMsg(
        isEN ? "Uploading to Cloudinary..." : "กำลังอัปโหลดไป Cloudinary..."
      );
      const up = await uploadToCloudinary(uploadFile);

      // 4) create slide
      setBusyMsg(isEN ? "Saving slide..." : "กำลังบันทึกสไลด์...");
      await jsonFetch("/api/admin/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          title,
          caption,
          linkUrl,
          isActive,
          imageUrl: up.imageUrl,
          imagePublicId: up.imagePublicId,
          publishedAt, // server ควร parse ให้เป็น Date
          readMins: Math.max(1, Number(readMins || 3)),
        }),
      });

      setFile(null);
      setTitle("");
      setCaption("");
      setLinkUrl("");
      setIsActive(true);
      setPublishedAt(new Date().toISOString().slice(0, 10));
      setReadMins(5);

      await load();
    } catch (err) {
      alert(err?.message || "Create failed");
    } finally {
      setBusy(false);
      setBusyMsg("");
    }
  }

  async function onPatch(id, patch) {
    try {
      const data = await jsonFetch("/api/admin/media", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });

      setItems((prev) => prev.map((x) => (x._id === id ? data.item : x)));
    } catch (err) {
      alert(err?.message || "Update failed");
    }
  }

  async function onDelete(id) {
    if (!confirm(isEN ? "Delete this slide?" : "ลบสไลด์นี้?")) return;
    try {
      await jsonFetch(`/api/admin/media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      alert(err?.message || "Delete failed");
    }
  }

  async function saveOrder(next) {
    setItems(next);
    try {
      await jsonFetch("/api/admin/media/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: next.map((x) => x._id) }),
      });
    } catch (err) {
      alert(err?.message || "Reorder failed");
      load();
    }
  }

  function move(idx, dir) {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    saveOrder(next);
  }

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((x) => x._id === active.id);
    const newIndex = items.findIndex((x) => x._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    saveOrder(next);
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <form
        onSubmit={onCreate}
        className="rounded-3xl border border-white/10 bg-white/5 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-white font-semibold text-lg">
            {isEN ? "Add new slide" : "เพิ่มสไลด์ใหม่"}
          </div>

          {busy ? (
            <div className="text-xs text-white/70">
              {busyMsg || (isEN ? "Working..." : "กำลังทำงาน...")}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="text-white/80 text-sm mb-1">
              {isEN ? "Image" : "รูปภาพ"}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-white"
              disabled={busy}
            />
            {file ? (
              <div className="mt-1 text-xs text-white/60">
                {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            ) : null}
          </label>

          <label className="block">
            <div className="text-white/80 text-sm mb-1">
              {isEN ? "Title" : "ชื่อภาพ"}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder={isEN ? "e.g. Event Highlight" : "เช่น ไฮไลต์กิจกรรม"}
              disabled={busy}
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-white/80 text-sm mb-1">
              {isEN ? "Caption" : "คำอธิบาย"}
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white min-h-[88px]"
              placeholder={isEN ? "Short description" : "คำอธิบายสั้น ๆ"}
              disabled={busy}
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-white/80 text-sm mb-1">
              {isEN ? "Link (optional)" : "ลิงก์ (ถ้ามี)"}
            </div>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
              placeholder="https://..."
              disabled={busy}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
            <label className="block">
              <div className="text-white/80 text-sm mb-1">
                {isEN ? "Published date" : "วันที่เผยแพร่"}
              </div>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                disabled={busy}
              />
            </label>

            <label className="block">
              <div className="text-white/80 text-sm mb-1">
                {isEN ? "Read time (mins)" : "เวลาอ่าน (นาที)"}
              </div>
              <input
                type="number"
                min={1}
                value={readMins}
                onChange={(e) => setReadMins(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                disabled={busy}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-white/90 md:col-span-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
            />
            {isEN ? "Active" : "เปิดแสดงผล"}
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className={cx(
            "mt-4 rounded-xl px-4 py-2 text-white",
            busy
              ? "bg-white/5 cursor-not-allowed"
              : "bg-white/10 hover:bg-white/15"
          )}
        >
          {busy
            ? isEN
              ? "Working..."
              : "กำลังทำงาน..."
            : isEN
            ? "Upload & Create"
            : "อัปโหลดและสร้าง"}
        </button>

        <div className="mt-2 text-xs text-white/50">
          {isEN
            ? "Tip: Large images will be compressed automatically to avoid Cloudinary 10MB limit."
            : "ทิป: รูปใหญ่จะถูกบีบอัดอัตโนมัติ เพื่อไม่ให้ชนลิมิต 10MB ของ Cloudinary"}
        </div>
      </form>

      {/* List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-white font-semibold text-lg">
            {isEN ? "Slides" : "รายการสไลด์"}
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-white/10 hover:bg-white/15 text-white px-3 py-2"
          >
            {isEN ? "Refresh" : "รีเฟรช"}
          </button>
        </div>

        {loading ? (
          <div className="text-white/70 mt-4">
            {isEN ? "Loading..." : "กำลังโหลด..."}
          </div>
        ) : items.length === 0 ? (
          <div className="text-white/70 mt-4">
            {isEN ? "No slides yet." : "ยังไม่มีสไลด์"}
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="mt-4 space-y-4">
                {items.map((it, idx) => (
                  <SortableRow key={it._id} id={it._id}>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 pl-12">
                      <div className="flex gap-4 items-start">
                        <div className="relative h-24 w-40 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                          <Image
                            src={it.imageUrl}
                            alt={it.title || "slide"}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 grid gap-2">
                          <input
                            defaultValue={it.title || ""}
                            onBlur={(e) =>
                              onPatch(it._id, { title: e.target.value })
                            }
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                            placeholder={isEN ? "Title" : "ชื่อภาพ"}
                          />

                          <textarea
                            defaultValue={it.caption || ""}
                            onBlur={(e) =>
                              onPatch(it._id, { caption: e.target.value })
                            }
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white min-h-[64px]"
                            placeholder={isEN ? "Caption" : "คำอธิบาย"}
                          />

                          <input
                            defaultValue={it.linkUrl || ""}
                            onBlur={(e) =>
                              onPatch(it._id, { linkUrl: e.target.value })
                            }
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                            placeholder={
                              isEN ? "Link (optional)" : "ลิงก์ (ถ้ามี)"
                            }
                          />

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="block">
                              <div className="text-white/80 text-sm mb-1">
                                {isEN ? "Published date" : "วันที่เผยแพร่"}
                              </div>
                              <input
                                type="date"
                                defaultValue={
                                  toDateInputValue(it.publishedAt) || ""
                                }
                                onBlur={(e) =>
                                  onPatch(it._id, {
                                    publishedAt: e.target.value || null,
                                  })
                                }
                                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                              />
                            </label>

                            <label className="block">
                              <div className="text-white/80 text-sm mb-1">
                                {isEN ? "Read time (mins)" : "เวลาอ่าน (นาที)"}
                              </div>
                              <input
                                type="number"
                                min={1}
                                defaultValue={it.readMins ?? 3}
                                onBlur={(e) =>
                                  onPatch(it._id, {
                                    readMins: Number(e.target.value || 3),
                                  })
                                }
                                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                              />
                            </label>
                          </div>

                          <label className="flex items-center gap-2 text-white/90">
                            <input
                              type="checkbox"
                              checked={!!it.isActive}
                              onChange={(e) =>
                                onPatch(it._id, { isActive: e.target.checked })
                              }
                            />
                            {isEN ? "Active" : "เปิดแสดงผล"}
                          </label>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => move(idx, -1)}
                            className="rounded-xl bg-white/10 hover:bg-white/15 text-white px-3 py-2"
                            disabled={idx === 0}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => move(idx, +1)}
                            className="rounded-xl bg-white/10 hover:bg-white/15 text-white px-3 py-2"
                            disabled={idx === items.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(it._id)}
                            className="rounded-xl bg-red-500/15 hover:bg-red-500/25 text-white px-3 py-2"
                          >
                            {isEN ? "Delete" : "ลบ"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-white/50 text-xs">
                        order: {it.order} • id: {it._id}
                      </div>
                    </div>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
