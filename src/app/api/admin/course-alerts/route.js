import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CourseAlertSubscriber from "@/models/CourseAlertSubscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const q = clean(searchParams.get("q"));
  const courseSlug = clean(searchParams.get("courseSlug"));
  const status = clean(searchParams.get("status"));

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(10, Number(searchParams.get("limit") || 20)),
  );
  const skip = (page - 1) * limit;

  const filter = {};

  if (q) {
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { emailNorm: { $regex: q, $options: "i" } },
      { courseSlug: { $regex: q, $options: "i" } },
    ];
  }

  if (courseSlug) {
    filter.courseSlug = { $regex: courseSlug, $options: "i" };
  }

  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    CourseAlertSubscriber.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseAlertSubscriber.countDocuments(filter),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.map((it) => ({
      _id: String(it._id),
      email: it.email || "",
      emailNorm: it.emailNorm || "",
      courseSlug: it.courseSlug || "",
      locale: it.locale || "th",
      source: it.source || "unknown",
      consentNotify: !!it.consentNotify,
      consentMarketing: !!it.consentMarketing,
      status: it.status || "active",
      subscribedAt: it.subscribedAt || it.createdAt || null,
      lastNotifiedAt: it.lastNotifiedAt || null,
      createdAt: it.createdAt || null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
