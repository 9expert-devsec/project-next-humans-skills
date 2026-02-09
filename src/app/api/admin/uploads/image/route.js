import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import MediaAsset from "@/models/MediaAsset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const mod = await import("@/lib/adminAuth.server");
  if (typeof mod.requireAdmin === "function") return mod.requireAdmin(req);
  throw new Error("requireAdmin() not found in /src/lib/adminAuth.server.js");
}

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function uploadToCloudinary(buffer, opts = {}) {
  const cloudinaryMod = await import("cloudinary");
  const cloudinary = cloudinaryMod.v2;

  cloudinary.config({
    cloud_name: env("CLOUDINARY_CLOUD_NAME"),
    api_key: env("CLOUDINARY_API_KEY"),
    api_secret: env("CLOUDINARY_API_SECRET"),
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder || "thenexthumansskills/articles",
        resource_type: "image",
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
    await dbConnect();
    const admin = await requireAdmin(req);

    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 },
      );
    }

    // Next FormData File
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    const result = await uploadToCloudinary(buffer, {
      folder: "thenexthumansskills/articles",
    });

    const asset = await MediaAsset.create({
      kind: "image",
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes || 0,
      format: result.format || "",
      folder:
        result.folder || ""
          ? `${result.folder}`
          : "thenexthumansskills/articles",
      createdBy: admin?._id,
    });

    return NextResponse.json({
      ok: true,
      asset: {
        _id: String(asset._id),
        url: asset.url,
        publicId: asset.publicId,
        width: asset.width,
        height: asset.height,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Upload error" },
      { status: 500 },
    );
  }
}
