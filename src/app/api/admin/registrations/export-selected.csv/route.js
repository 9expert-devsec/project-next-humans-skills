import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import Registration from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escCsv(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeIds(arr) {
  return Array.isArray(arr)
    ? arr.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
}

export async function POST(req) {
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const ids = normalizeIds(body?.ids);

  if (!ids.length) {
    return new Response("ids required", { status: 400 });
  }

  const objectIds = ids
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) {
    return new Response("no valid ids", { status: 400 });
  }

  // ดึงเรียงตาม createdAt ใหม่ -> เก่า (ถ้าต้องการเรียงตาม selection เดิม เราค่อยเพิ่มภายหลัง)
  const items = await Registration.find({ _id: { $in: objectIds } })
    .sort({ createdAt: -1 })
    .lean();

  const header = [
    "id",
    "createdAt",
    "status",
    "locale",
    "courseSlug",
    "trainee_count",
    "month_interest",
    "year_interest",
    "training_location",
    "first_name",
    "last_name",
    "email",
    "contact_phone",
    "company",
    "tax_id",
    "company_phone",
    "receipt_address",
    "province",
    "district",
    "subdistrict",
    "postcode",
    "note",
    "ip",
    "userAgent",
  ];

  const lines = [];
  lines.push(header.join(","));

  for (const it of items) {
    const row = [
      it._id,
      it.createdAt ? new Date(it.createdAt).toISOString() : "",
      it.status || "",
      it.locale || "",
      it.courseSlug || "",
      it.trainee_count ?? "",
      it.month_interest || "",
      it.year_interest || "",
      it.training_location || "",
      it.first_name || "",
      it.last_name || "",
      it.email || "",
      it.contact_phone || "",
      it.company || "",
      it.tax_id || "",
      it.company_phone || "",
      it.receipt_address || "",
      it.province || "",
      it.district || "",
      it.subdistrict || "",
      it.postcode || "",
      it.note || "",
      it.ip || "",
      it.userAgent || "",
    ].map(escCsv);

    lines.push(row.join(","));
  }

  const csv = "\uFEFF" + lines.join("\n"); // BOM สำหรับ Excel

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="registrations-selected.csv"`,
      "cache-control": "no-store",
    },
  });
}
