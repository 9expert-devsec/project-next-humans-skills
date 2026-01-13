import crypto from "crypto";
import { requireAdmin } from "@/lib/adminAuth.server";
import { toJsonError } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha1(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

export async function POST(req) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const folder = String(body?.folder || "next-humans/media");
    const timestamp = Math.floor(Date.now() / 1000);

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return Response.json(
        { ok: false, error: "Cloudinary env missing" },
        { status: 500 }
      );
    }

    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = sha1(toSign);

    return Response.json({
      ok: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (err) {
    return toJsonError(err);
  }
}
