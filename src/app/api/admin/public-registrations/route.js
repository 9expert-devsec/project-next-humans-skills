import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UpcomingRegistration from "@/models/UpcomingRegistration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function pick(...vals) {
  for (const v of vals) {
    const s = clean(v);
    if (s) return s;
  }
  return "";
}

function traineeCountOf(it) {
  if (Number.isFinite(Number(it?.trainee_count))) {
    return Number(it.trainee_count);
  }
  if (Array.isArray(it?.trainees)) return it.trainees.length;
  return 0;
}

function normalizeItem(it) {
  return {
    _id: String(it._id),
    ref_no: pick(it.ref_no, it.refNo),
    courseSlug: pick(it.courseSlug, it.course_slug),
    courseTitle: pick(
      it.courseTitle,
      it.course_title,
      it.course_title_subject,
      it.title,
    ),
    courseDateText: pick(it.courseDateText, it.course_date_text),
    coordinatorName: pick(
      it.coordinator?.name,
      it.coordinator_name,
      it.contact_name,
    ),
    coordinatorEmail: pick(
      it.coordinator?.email,
      it.coordinator_email,
      it.email,
    ),
    coordinatorPhone: pick(
      it.coordinator?.phone,
      it.coordinator_phone,
      it.contact_phone,
    ),
    company: pick(
      it.coordinator?.company,
      it.coordinator_company,
      it.company,
      it.invoice_company_name,
    ),
    traineeCount: traineeCountOf(it),
    sourceChannel: pick(it.source_channel, it.sourceChannel),
    status: pick(it.status) || "new",
    createdAt: it.createdAt || it.submitted_at || null,
  };
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const q = clean(searchParams.get("q"));
  const courseSlug = clean(searchParams.get("courseSlug"));
  const status = clean(searchParams.get("status"));
  const from = clean(searchParams.get("from"));
  const to = clean(searchParams.get("to"));

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(10, Number(searchParams.get("limit") || 20)),
  );
  const skip = (page - 1) * limit;

  const filter = {};

  if (q) {
    filter.$or = [
      { ref_no: { $regex: q, $options: "i" } },
      { refNo: { $regex: q, $options: "i" } },
      { courseSlug: { $regex: q, $options: "i" } },
      { course_slug: { $regex: q, $options: "i" } },
      { courseTitle: { $regex: q, $options: "i" } },
      { course_title: { $regex: q, $options: "i" } },
      { course_title_subject: { $regex: q, $options: "i" } },
      { coordinator_name: { $regex: q, $options: "i" } },
      { coordinator_email: { $regex: q, $options: "i" } },
      { coordinator_company: { $regex: q, $options: "i" } },
      { "coordinator.name": { $regex: q, $options: "i" } },
      { "coordinator.email": { $regex: q, $options: "i" } },
      { "coordinator.company": { $regex: q, $options: "i" } },
    ];
  }

  if (courseSlug) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { courseSlug: { $regex: courseSlug, $options: "i" } },
        { course_slug: { $regex: courseSlug, $options: "i" } },
      ],
    });
  }

  if (status) {
    filter.status = status;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  const [items, total] = await Promise.all([
    UpcomingRegistration.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UpcomingRegistration.countDocuments(filter),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.map(normalizeItem),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
