import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const mod = await import("@/lib/adminAuth.server");
  if (typeof mod.requireAdmin === "function") return mod.requireAdmin(req);
  throw new Error("requireAdmin() not found in /src/lib/adminAuth.server.js");
}

function clean(x) {
  return String(x || "").trim();
}

function requireCloudinary() {
  const name = clean(process.env.CLOUDINARY_CLOUD_NAME);
  const key = clean(process.env.CLOUDINARY_API_KEY);
  const secret = clean(process.env.CLOUDINARY_API_SECRET);
  if (!name || !key || !secret) {
    throw new Error(
      "Missing Cloudinary env (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)",
    );
  }
  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
    secure: true,
  });
}

function uploadBuffer(buffer, opts) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function POST(req) {
  try {
    await requireAdmin(req);
    requireCloudinary();

    const { searchParams } = new URL(req.url);
    const kind = clean(searchParams.get("kind")); // "audio" | "file" | ""
    const folder = clean(searchParams.get("folder")) || "articles";

    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 },
      );
    }

    const mime = clean(file.type);
    const name = clean(file.name);

    // ✅ limit เบื้องต้น (ปรับได้)
    const ab = await file.arrayBuffer();
    const bytes = ab.byteLength || 0;
    const MAX = 25 * 1024 * 1024; // 25MB
    if (bytes > MAX) {
      return NextResponse.json(
        { ok: false, error: "File too large (max 25MB)" },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(ab);

    const isAudio = kind === "audio" || mime.startsWith("audio/");
    const resource_type = isAudio ? "video" : "raw";

    const result = await uploadBuffer(buffer, {
      folder: isAudio ? `${folder}/audio` : `${folder}/files`,
      resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return NextResponse.json({
      ok: true,
      asset: {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        bytes: result.bytes || bytes,
        mime: mime || (isAudio ? "audio/*" : "application/octet-stream"),
        name: name || result.original_filename || "",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
