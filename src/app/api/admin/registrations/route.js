import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(x, d = 1) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

function clean(s) {
  return String(s || "").trim();
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

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const page = Math.max(1, toInt(searchParams.get("page"), 1));
  const limitRaw = toInt(searchParams.get("limit"), 20);
  const limit = Math.min(100, Math.max(5, limitRaw));
  const skip = (page - 1) * limit;

  const q = clean(searchParams.get("q"));
  const status = clean(searchParams.get("status"));
  const courseSlug = clean(searchParams.get("courseSlug"));

  const dateFrom = clean(searchParams.get("from"));
  const dateTo = clean(searchParams.get("to"));
  const createdRange = makeDateRange(dateFrom, dateTo);

  const where = {};

  if (status) where.status = status;
  if (courseSlug) where.courseSlug = courseSlug;
  if (createdRange) where.createdAt = createdRange;

  if (q) {
    const or = [];

    // search by ObjectId (registrationId)
    if (mongoose.Types.ObjectId.isValid(q)) {
      or.push({ _id: new mongoose.Types.ObjectId(q) });
    }

    // search by text fields
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    or.push(
      { first_name: rx },
      { last_name: rx },
      { email: rx },
      { company: rx },
      { tax_id: rx },
      { contact_phone: rx },
      { courseSlug: rx }
    );

    where.$or = or;
  }

  const [total, items] = await Promise.all([
    Registration.countDocuments(where),
    Registration.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return NextResponse.json({
    ok: true,
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
