export function toCloudinaryAttachmentUrl(url, filename) {
  const u = String(url || "");
  if (!u) return "";

  // Cloudinary filename ใน fl_attachment แนะนำเป็น ascii จะชัวร์สุด
  const safe = String(filename || "download")
    .trim()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const marker = "/upload/";
  const i = u.indexOf(marker);
  if (i < 0) return u;

  const before = u.slice(0, i + marker.length);
  const after = u.slice(i + marker.length);

  // ใส่ fl_attachment ก่อน version/path
  return `${before}fl_attachment:${safe}/${after}`;
}
