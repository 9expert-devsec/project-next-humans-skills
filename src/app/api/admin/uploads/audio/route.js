import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const mod = await import("@/lib/adminAuth.server");
  if (typeof mod.requireAdmin === "function") return mod.requireAdmin(req);
  throw new Error("requireAdmin() not found in /src/lib/adminAuth.server.js");
}

function ensureCloudinary() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) throw new Error("Missing Cloudinary env");
  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
}

function isAllowedAudio(mime) {
  const ok = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/wav",
    "audio/aac",
    "audio/ogg",
    "application/octet-stream", // บาง browser ส่งมาแบบนี้
  ]);
  return ok.has(String(mime || "").toLowerCase());
}

async function uploadToCloudinary(buffer, filename) {
  ensureCloudinary();

  // Cloudinary แนะนำใช้ resource_type: "video" สำหรับไฟล์เสียง
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "thenexthumansskills/articles/audio",
        public_id: undefined,
        overwrite: true,
        filename_override: filename || undefined,
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function POST(req) {
  try {
    await requireAdmin(req);

    const fd = await req.formData();
    const file = fd.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 },
      );
    }

    const mime = file.type || "";
    if (!isAllowedAudio(mime)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported audio type: ${mime || "unknown"}` },
        { status: 400 },
      );
    }

    const ab = await file.arrayBuffer();
    const bytes = ab.byteLength;

    // กันไฟล์ใหญ่มากเกิน (ปรับได้)
    const MAX = 40 * 1024 * 1024; // 40MB
    if (bytes > MAX) {
      return NextResponse.json(
        { ok: false, error: "File too large" },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(ab);
    const result = await uploadToCloudinary(buffer, file.name || "audio");

    return NextResponse.json({
      ok: true,
      asset: {
        url: result.secure_url || result.url || "",
        publicId: result.public_id || "",
        bytes: result.bytes || bytes,
        format: result.format || "",
        resourceType: result.resource_type || "video",
        duration: result.duration || 0,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
