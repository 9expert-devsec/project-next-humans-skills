import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s) {
  return String(s || "").trim();
}

function escCsv(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function makeDateRange(from, to) {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  return Object.keys(range).length ? range : null;
}

function buildWhere(searchParams) {
  const q = clean(searchParams.get("q"));
  const status = clean(searchParams.get("status"));
  const courseSlug = clean(searchParams.get("courseSlug"));
  const from = clean(searchParams.get("from"));
  const to = clean(searchParams.get("to"));
  const createdRange = makeDateRange(from, to);

  const where = {};
  if (status) where.status = status;
  if (courseSlug) where.courseSlug = courseSlug;
  if (createdRange) where.createdAt = createdRange;

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    where.$or = [
      { first_name: rx },
      { last_name: rx },
      { email: rx },
      { company: rx },
      { tax_id: rx },
      { contact_phone: rx },
      { courseSlug: rx },
    ];
  }

  return where;
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const where = buildWhere(searchParams);

  const items = await Registration.find(where)
    .sort({ createdAt: -1 })
    .limit(20000) // กันพัง
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

  // UTF-8 BOM เพื่อ Excel เปิดไทยไม่เพี้ยน
  const csv = "\uFEFF" + lines.join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="registrations.csv"`,
      "cache-control": "no-store",
    },
  });
}
