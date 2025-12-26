import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(v) {
  const s = String(v ?? "");
  // CSV escape
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtDateISO(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
}

export async function GET(req) {
  const auth = requireAdmin();
  if (!auth.ok) return new Response("Unauthorized", { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const status = String(searchParams.get("status") || "").trim();

  const where = {};
  if (q) {
    where.$or = [
      { "coordinator.firstName": new RegExp(q, "i") },
      { "coordinator.lastName": new RegExp(q, "i") },
      { "coordinator.company": new RegExp(q, "i") },
      { "coordinator.phone": new RegExp(q, "i") },
      { "coordinator.taxNumber": new RegExp(q, "i") },
      { "coordinator.email": new RegExp(q, "i") },
    ];
  }
  if (status) where.status = status;

  const items = await Registration.find(where)
    .sort({ createdAt: -1 })
    .limit(5000)
    .populate("courseId")
    .lean();

  const header = [
    "registrationId",
    "createdAt",
    "updatedAt",
    "status",
    "courseTitleTH",
    "courseTitleEN",
    "interestMonth",
    "interestYear",
    "trainingLocation",
    "traineeCount",
    "taxNumber",
    "fullName",
    "company",
    "branch",
    "phone",
    "companyPhone",
    "email",
    "province",
    "district",
    "subDistrict",
    "postcode",
    "addressForReceipt",
    "userNote",
    "internalNote",
  ];

  const rows = items.map((it) => {
    const c = it.coordinator || {};
    const course = it.courseId || {};
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();

    return [
      String(it._id || ""),
      fmtDateISO(it.createdAt),
      fmtDateISO(it.updatedAt),
      it.status || "",
      course.title_th || "",
      course.title_en || "",
      it.interestMonth || "",
      it.interestYear || "",
      it.trainingLocationText || "",
      it.traineeCount || "",
      c.taxNumber || "",
      fullName,
      c.company || "",
      c.branch || "",
      c.phone || "",
      c.companyPhone || "",
      c.email || "",
      c.province || "",
      c.district || "",
      c.subDistrict || "",
      c.postcode || "",
      c.addressForReceipt || "",
      it.note || "",
      it.internalNote || "",
    ]
      .map(esc)
      .join(",");
  });

  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const csv = bom + header.join(",") + "\n" + rows.join("\n");

  const fileName = `registrations_${status || "ALL"}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
