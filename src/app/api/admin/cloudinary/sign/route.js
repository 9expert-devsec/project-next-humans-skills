import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  await requireAdmin(); // ✅ ต้อง await

  const body = await req.json().catch(() => ({}));
  const timestamp = Math.round(Date.now() / 1000);
  const folder = String(body.folder || "next-skills").trim();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { ok: false, message: "Missing Cloudinary env" },
      { status: 500 }
    );
  }

  // sign params แบบ Cloudinary
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return NextResponse.json({
    ok: true,
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
  });
}
