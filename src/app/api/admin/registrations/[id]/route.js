import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS = ["new", "contacted", "done", "cancelled"];

function clean(s) {
  return String(s || "").trim();
}

export async function GET(_req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "invalid id" },
      { status: 400 }
    );
  }

  const item = await Registration.findById(id).lean();
  if (!item) {
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "invalid id" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const patch = {};
  if (body.status !== undefined) {
    const s = clean(body.status);
    if (!STATUS.includes(s)) {
      return NextResponse.json(
        { ok: false, error: "invalid status" },
        { status: 400 }
      );
    }
    patch.status = s;
  }

  // internal note สำหรับทีม (ไม่ใช่ note ที่ user กรอก)
  if (body.internal_note !== undefined) {
    patch.internal_note = clean(body.internal_note);
  }

  const updated = await Registration.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, item: updated });
}
