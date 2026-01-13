import "server-only";
import crypto from "crypto";

function sha1(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

export async function cloudinaryDestroyImage(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env missing");
  }
  if (!publicId) return { ok: true, result: "no_public_id" };

  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary destroy signature: public_id=<id>&timestamp=<ts><api_secret>
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = sha1(toSign);

  const form = new URLSearchParams();
  form.set("public_id", publicId);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
  const res = await fetch(url, { method: "POST", body: form }).catch(
    () => null
  );
  const data = await res?.json().catch(() => ({}));

  if (!res || !res.ok) {
    throw new Error(data?.error?.message || "Cloudinary destroy failed");
  }

  // data.result มักเป็น "ok" หรือ "not found"
  return { ok: true, data };
}
