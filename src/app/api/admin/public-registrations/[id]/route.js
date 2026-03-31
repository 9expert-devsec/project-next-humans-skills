import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import UpcomingRegistration from "@/models/UpcomingRegistration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["new", "contacted", "done", "cancelled", ""]);

const ALLOWED_SOURCE_CHANNEL = new Set([
  "Bitkub Academy",
  "9Expert Training",
  "Key Solutions Training",
  "Other",
  "",
]);

const ALLOWED_TAX_TYPE = new Set(["personal", "company"]);

function clean(x) {
  return String(x || "").trim();
}

function digitsOnly(x) {
  return String(x || "").replace(/\D/g, "");
}

function toSafeInt(x, fallback = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function isBadId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function normalizeTrainee(t = {}) {
  return {
    first_name: clean(t.first_name),
    last_name: clean(t.last_name),
    email: clean(t.email),
    phone: digitsOnly(t.phone),
    phone_raw: clean(t.phone_raw || t.phone),
  };
}

function buildPatch(body = {}) {
  const patch = {};

  if ("ref_no" in body) patch.ref_no = clean(body.ref_no);
  if ("courseSlug" in body) patch.courseSlug = clean(body.courseSlug);
  if ("locale" in body) patch.locale = clean(body.locale) || "th";

  if ("trainee_count" in body) {
    patch.trainee_count = Math.max(1, toSafeInt(body.trainee_count, 1));
  }
  if ("coordinator_is_trainee" in body) {
    patch.coordinator_is_trainee = !!body.coordinator_is_trainee;
  }
  if ("no_trainees_yet" in body) {
    patch.no_trainees_yet = !!body.no_trainees_yet;
  }

  const coordinator = body?.coordinator || {};
  patch.coordinator = {
    first_name: clean(coordinator.first_name),
    last_name: clean(coordinator.last_name),
    email: clean(coordinator.email),
    phone: digitsOnly(coordinator.phone),
    phone_raw: clean(coordinator.phone_raw || coordinator.phone),
  };

  const trainees = Array.isArray(body?.trainees) ? body.trainees : [];
  patch.trainees = trainees.map(normalizeTrainee);

  const tax = body?.tax || {};
  const taxType = clean(tax.type);
  patch.tax = {
    type: ALLOWED_TAX_TYPE.has(taxType) ? taxType : "personal",

    personal_first_name: clean(tax.personal_first_name),
    personal_last_name: clean(tax.personal_last_name),

    company_name: clean(tax.company_name),
    branch: clean(tax.branch) || "สำนักงานใหญ่",

    tax_id: digitsOnly(tax.tax_id),
    phone: digitsOnly(tax.phone),
    phone_raw: clean(tax.phone_raw || tax.phone),

    address: clean(tax.address),
    province: clean(tax.province),
    district: clean(tax.district),
    subdistrict: clean(tax.subdistrict),
    postcode: digitsOnly(tax.postcode),
  };

  if ("source_channel" in body) {
    const v = clean(body.source_channel);
    patch.source_channel = ALLOWED_SOURCE_CHANNEL.has(v) ? v : "";
  }
  if ("source_other" in body) patch.source_other = clean(body.source_other);

  if ("note" in body) patch.note = clean(body.note);

  if ("status" in body) {
    const v = clean(body.status);
    patch.status = ALLOWED_STATUS.has(v) && v ? v : "new";
  }

  if ("source" in body) patch.source = clean(body.source) || "web";

  return patch;
}

export async function GET(req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (isBadId(id)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 },
    );
  }

  const item = await UpcomingRegistration.findById(id).lean();

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item });
}

export async function PUT(req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (isBadId(id)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const patch = buildPatch(body);

  const item = await UpcomingRegistration.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  }).lean();

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (isBadId(id)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 },
    );
  }

  const item = await UpcomingRegistration.findByIdAndDelete(id).lean();

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, deletedId: id });
}
