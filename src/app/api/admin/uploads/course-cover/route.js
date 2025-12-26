// src/app/api/admin/uploads/course-cover/route.js
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "next-skills/courses").trim();

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "file is required" },
        { status: 400 }
      );
    }

    // file เป็น Blob -> แปลงเป็น buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          overwrite: true,
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      url: res.secure_url,
      publicId: res.public_id,
      width: res.width,
      height: res.height,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "upload failed" },
      { status: 500 }
    );
  }
}
