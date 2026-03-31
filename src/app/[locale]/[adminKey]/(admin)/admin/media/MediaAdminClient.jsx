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
import {
  CalendarDays,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Link as LinkIcon,
  Newspaper,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

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

function fmtDateTH(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" });
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/55">{label}</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs font-medium text-white/40">{hint}</div>
          ) : null}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Icon className="h-5 w-5 text-white/75" />
        </div>
      </div>
    </div>
  );
}

function MetaBadge({ children }) {
  if (!children) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/60">
      {children}
    </span>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section
      className={cx(
        "rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] lg:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="mb-1.5 text-sm font-medium text-white/75">{children}</div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cx(
        "h-11 w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25",
        props.className,
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-2xl border border-white/10 bg-[#0b1727] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/25",
        props.className,
      )}
    />
  );
}

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
          "absolute left-4 top-4 z-10 rounded-2xl border border-white/10",
          "bg-black/40 p-2.5 text-white hover:bg-black/60",
          isDragging && "bg-black/70",
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

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [publishedAt, setPublishedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
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
        { cache: "no-store" },
      );
      setItems(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      () => null,
    );
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      throw new Error(data?.error?.message || "Upload failed");
    }

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
          : `ไฟล์ใหญ่เกิน ${HARD_LIMIT_MB}MB กรุณาย่อรูปก่อน`,
      );
      return;
    }

    try {
      setBusy(true);

      let uploadFile = file;
      if (file.size > 1024 * 1024) {
        setBusyMsg(isEN ? "Compressing image..." : "กำลังบีบอัดรูป...");
        uploadFile = await compressImage(file);
      }

      const SAFE_MB = 9.5;
      if (uploadFile.size > SAFE_MB * 1024 * 1024) {
        alert(
          isEN
            ? "Image is still too large after compression. Please resize/crop and try again."
            : "รูปยังใหญ่เกินหลังบีบอัด กรุณาย่อ/ครอป แล้วลองใหม่",
        );
        return;
      }

      setBusyMsg(
        isEN ? "Uploading to Cloudinary..." : "กำลังอัปโหลดไป Cloudinary...",
      );
      const up = await uploadToCloudinary(uploadFile);

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
          publishedAt,
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

  const stats = useMemo(() => {
    const total = items.length;
    const activeCount = items.filter((x) => !!x?.isActive).length;
    const inactiveCount = total - activeCount;
    const publishedCount = items.filter((x) => !!x?.publishedAt).length;

    return { total, activeCount, inactiveCount, publishedCount };
  }, [items]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Media slider management
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Media Slider
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              อัปโหลดรูป จัดลำดับ เปิดหรือปิดการแสดงผล
              และแก้ไขรายละเอียดของสไลด์ ให้เป็นระบบเดียวกันในหลังบ้าน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon={ImageIcon}
          label="Total Slides"
          value={stats.total}
          hint="จำนวนสไลด์ทั้งหมดในระบบ"
        />
        <StatCard
          icon={Eye}
          label="Active"
          value={stats.activeCount}
          hint="สไลด์ที่เปิดแสดงผล"
        />
        <StatCard
          icon={Trash2}
          label="Inactive"
          value={stats.inactiveCount}
          hint="สไลด์ที่ปิดการแสดงผล"
        />
        <StatCard
          icon={CalendarDays}
          label="Published Date Set"
          value={stats.publishedCount}
          hint="รายการที่กำหนดวันที่เผยแพร่แล้ว"
        />
      </section>

      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-lg font-bold text-white">
              {isEN ? "Add new slide" : "เพิ่มสไลด์ใหม่"}
            </div>
            <div className="mt-1 text-sm text-white/50">
              {isEN
                ? "Upload image, set metadata, then create a new media slide."
                : "อัปโหลดรูป ตั้งค่ารายละเอียด แล้วสร้างสไลด์ใหม่"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaBadge>Cloudinary upload</MetaBadge>
            <MetaBadge>Auto compression</MetaBadge>
            <MetaBadge>Published date + read time</MetaBadge>
          </div>
        </div>

        <form onSubmit={onCreate} className="mt-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>{isEN ? "Image" : "รูปภาพ"}</FieldLabel>
              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-[#0b1727] px-4 py-6 text-center transition hover:border-white/25 hover:bg-[#0d1b2e]">
                <Upload className="mb-3 h-6 w-6 text-white/65" />
                <div className="text-sm font-semibold text-white">
                  {isEN ? "Click to upload image" : "คลิกเพื่อเลือกรูปภาพ"}
                </div>
                <div className="mt-1 text-xs text-white/45">
                  JPG, PNG, WEBP · Auto-compress when large
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={busy}
                />
              </label>

              {file ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  <div className="font-medium text-white">{file.name}</div>
                  <div className="mt-1 text-xs text-white/45">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel>{isEN ? "Title" : "ชื่อภาพ"}</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isEN ? "e.g. Event Highlight" : "เช่น ไฮไลต์กิจกรรม"
                  }
                  disabled={busy}
                />
              </div>

              <div>
                <FieldLabel>{isEN ? "Caption" : "คำอธิบาย"}</FieldLabel>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[110px]"
                  placeholder={isEN ? "Short description" : "คำอธิบายสั้น ๆ"}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>
                {isEN ? "Link (optional)" : "ลิงก์ (ถ้ามี)"}
              </FieldLabel>
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="pl-11"
                  placeholder="https://..."
                  disabled={busy}
                />
              </div>
            </div>

            <div>
              <FieldLabel>
                {isEN ? "Published date" : "วันที่เผยแพร่"}
              </FieldLabel>
              <Input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                disabled={busy}
              />
            </div>

            <div>
              <FieldLabel>
                {isEN ? "Read time (mins)" : "เวลาอ่าน (นาที)"}
              </FieldLabel>
              <Input
                type="number"
                min={1}
                value={readMins}
                onChange={(e) => setReadMins(e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1727] px-4 py-3 text-sm text-white">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={busy}
                />
                <span>{isEN ? "Active" : "เปิดแสดงผล"}</span>
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-white/45">
              {busy
                ? busyMsg || (isEN ? "Working..." : "กำลังทำงาน...")
                : isEN
                  ? "Tip: Large images will be compressed automatically to avoid Cloudinary 10MB limit."
                  : "ทิป: รูปใหญ่จะถูกบีบอัดอัตโนมัติ เพื่อไม่ให้ชนลิมิต 10MB ของ Cloudinary"}
            </div>

            <button
              type="submit"
              disabled={busy}
              className={cx(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition",
                busy
                  ? "border border-white/10 bg-white/[0.03] text-white/30"
                  : "bg-white text-slate-950 hover:bg-white/90",
              )}
            >
              <Upload className="h-4 w-4" />
              {busy
                ? isEN
                  ? "Working..."
                  : "กำลังทำงาน..."
                : isEN
                  ? "Upload & Create"
                  : "อัปโหลดและสร้าง"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-lg font-bold text-white">
              {isEN ? "Slides" : "รายการสไลด์"}
            </div>
            <div className="mt-1 text-sm text-white/50">
              {isEN
                ? "Drag to reorder, edit inline, and toggle slide visibility."
                : "ลากเพื่อจัดลำดับ แก้ไขข้อมูลได้ทันที และเปิดหรือปิดการแสดงผลได้"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetaBadge>Dnd reorder</MetaBadge>
            <MetaBadge>Inline edit</MetaBadge>
            <MetaBadge>{items.length} items</MetaBadge>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 px-5 py-10 text-center text-white/60">
            {isEN ? "Loading..." : "กำลังโหลด..."}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 px-5 py-10 text-center">
            <div className="text-lg font-bold text-white">
              {isEN ? "No slides yet" : "ยังไม่มีสไลด์"}
            </div>
            <div className="mt-2 text-sm text-white/45">
              {isEN
                ? "Create your first media slide from the form above."
                : "เริ่มเพิ่มสไลด์แรกจากฟอร์มด้านบนได้เลย"}
            </div>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="mt-5 space-y-4">
                {items.map((it, idx) => (
                  <SortableRow key={it._id} id={it._id}>
                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-4 pl-14 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start">
                        <div className="relative h-40 w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/30 sm:h-44 2xl:h-32 2xl:w-[260px]">
                          <Image
                            src={it.imageUrl}
                            alt={it.title || "slide"}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <FieldLabel>
                                {isEN ? "Title" : "ชื่อภาพ"}
                              </FieldLabel>
                              <Input
                                defaultValue={it.title || ""}
                                onBlur={(e) =>
                                  onPatch(it._id, { title: e.target.value })
                                }
                                placeholder={isEN ? "Title" : "ชื่อภาพ"}
                              />
                            </div>

                            <div>
                              <FieldLabel>
                                {isEN ? "Link (optional)" : "ลิงก์ (ถ้ามี)"}
                              </FieldLabel>
                              <Input
                                defaultValue={it.linkUrl || ""}
                                onBlur={(e) =>
                                  onPatch(it._id, { linkUrl: e.target.value })
                                }
                                placeholder="https://..."
                              />
                            </div>

                            <div className="lg:col-span-2">
                              <FieldLabel>
                                {isEN ? "Caption" : "คำอธิบาย"}
                              </FieldLabel>
                              <Textarea
                                defaultValue={it.caption || ""}
                                onBlur={(e) =>
                                  onPatch(it._id, { caption: e.target.value })
                                }
                                className="min-h-[90px]"
                                placeholder={isEN ? "Caption" : "คำอธิบาย"}
                              />
                            </div>

                            <div>
                              <FieldLabel>
                                {isEN ? "Published date" : "วันที่เผยแพร่"}
                              </FieldLabel>
                              <Input
                                type="date"
                                defaultValue={
                                  toDateInputValue(it.publishedAt) || ""
                                }
                                onBlur={(e) =>
                                  onPatch(it._id, {
                                    publishedAt: e.target.value || null,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <FieldLabel>
                                {isEN ? "Read time (mins)" : "เวลาอ่าน (นาที)"}
                              </FieldLabel>
                              <Input
                                type="number"
                                min={1}
                                defaultValue={it.readMins ?? 3}
                                onBlur={(e) =>
                                  onPatch(it._id, {
                                    readMins: Number(e.target.value || 3),
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1727] px-4 py-3 text-sm text-white">
                              <input
                                type="checkbox"
                                checked={!!it.isActive}
                                onChange={(e) =>
                                  onPatch(it._id, {
                                    isActive: e.target.checked,
                                  })
                                }
                              />
                              <span>{isEN ? "Active" : "เปิดแสดงผล"}</span>
                            </label>

                            <MetaBadge>
                              {isEN ? "Order" : "ลำดับ"}: {it.order}
                            </MetaBadge>
                            <MetaBadge>
                              {isEN ? "Published" : "เผยแพร่"}:{" "}
                              {fmtDateTH(it.publishedAt)}
                            </MetaBadge>
                            <MetaBadge>ID: {it._id}</MetaBadge>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-row gap-2 2xl:w-[92px] 2xl:flex-col">
                          <button
                            type="button"
                            onClick={() => move(idx, -1)}
                            className={cx(
                              "inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] 2xl:flex-none",
                              idx === 0 && "cursor-not-allowed opacity-40",
                            )}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() => move(idx, +1)}
                            className={cx(
                              "inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] 2xl:flex-none",
                              idx === items.length - 1 &&
                                "cursor-not-allowed opacity-40",
                            )}
                            disabled={idx === items.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(it._id)}
                            className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-rose-500/15 px-3 text-sm font-bold text-rose-100 transition hover:bg-rose-500/25 2xl:flex-none"
                          >
                            {isEN ? "Delete" : "ลบ"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Panel>
    </div>
  );
}
