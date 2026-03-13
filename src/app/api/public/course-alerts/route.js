import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import CourseAlertSubscriber from "@/models/CourseAlertSubscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

function normalizeEmail(x) {
  return clean(x).toLowerCase();
}

function isValidEmail(x) {
  const s = clean(x);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function makeToken() {
  return randomBytes(24).toString("hex");
}

function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req) {
  await dbConnect();

  let body = {};
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const courseSlug = clean(body?.courseSlug);
  const email = clean(body?.email);
  const emailNorm = normalizeEmail(email);
  const locale = clean(body?.locale) === "en" ? "en" : "th";

  const sourceRaw = clean(body?.source);
  const source = ["course_card", "course_detail"].includes(sourceRaw)
    ? sourceRaw
    : "unknown";

  const consentNotify = !!body?.consentNotify;
  const consentMarketing = !!body?.consentMarketing;

  if (!courseSlug) {
    return jsonError("Missing courseSlug", 400);
  }

  if (!isValidEmail(email)) {
    return jsonError("Please enter a valid email address", 400);
  }

  if (!consentNotify) {
    return jsonError("Consent is required", 400);
  }

  const course = await Course.findOne({
    slug: courseSlug,
    isActive: true,
    status: "published",
  })
    .select("_id slug title_th title_en isActive status")
    .lean();

  if (!course) {
    return jsonError("Course not found", 404);
  }

  const existing = await CourseAlertSubscriber.findOne({
    courseId: course._id,
    emailNorm,
  });

  if (!existing) {
    await CourseAlertSubscriber.create({
      courseId: course._id,
      courseSlug: course.slug || "",
      email,
      emailNorm,
      locale,
      source,
      consentNotify: true,
      consentMarketing,
      status: "active",
      subscribedAt: new Date(),
      unsubscribedAt: null,
      unsubscribeToken: makeToken(),
    });

    return NextResponse.json({
      ok: true,
      subscribed: true,
      alreadyExists: false,
    });
  }

  let changed = false;

  if (existing.email !== email) {
    existing.email = email;
    changed = true;
  }

  if (existing.locale !== locale) {
    existing.locale = locale;
    changed = true;
  }

  if (existing.source !== source && existing.source === "unknown") {
    existing.source = source;
    changed = true;
  }

  if (existing.consentNotify !== true) {
    existing.consentNotify = true;
    changed = true;
  }

  if (existing.consentMarketing !== consentMarketing) {
    existing.consentMarketing = consentMarketing;
    changed = true;
  }

  if (existing.status !== "active") {
    existing.status = "active";
    existing.unsubscribedAt = null;
    changed = true;
  }

  if (!clean(existing.unsubscribeToken)) {
    existing.unsubscribeToken = makeToken();
    changed = true;
  }

  if (changed) {
    await existing.save();
  }

  return NextResponse.json({
    ok: true,
    subscribed: true,
    alreadyExists: true,
  });
}
