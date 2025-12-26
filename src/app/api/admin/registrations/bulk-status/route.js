import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS = ["new", "contacted", "done", "cancelled"];

function normalizeIds(arr) {
  return Array.isArray(arr)
    ? arr.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
}

export async function PATCH(req) {
  await dbConnect();
  const body = await req.json().catch(() => ({}));

  const ids = normalizeIds(body.ids);
  const status = String(body.status || "").trim();

  if (!ids.length) {
    return NextResponse.json(
      { ok: false, error: "ids required" },
      { status: 400 }
    );
  }
  if (!STATUS.includes(status)) {
    return NextResponse.json(
      { ok: false, error: "invalid status" },
      { status: 400 }
    );
  }

  const objectIds = ids
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) {
    return NextResponse.json(
      { ok: false, error: "no valid ids" },
      { status: 400 }
    );
  }

  const r = await Registration.updateMany(
    { _id: { $in: objectIds } },
    { $set: { status } }
  );

  return NextResponse.json({
    ok: true,
    matched: r.matchedCount ?? r.n ?? 0,
    modified: r.modifiedCount ?? r.nModified ?? 0,
  });
}
