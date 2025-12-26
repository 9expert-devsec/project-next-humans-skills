import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, ctx) {
  await dbConnect();

  // Next 15: ctx.params อาจเป็น Promise ต้อง await
  const p = await ctx.params;
  const id = String(p?.id || "").trim();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json(
      { ok: false, error: "Invalid registration id" },
      { status: 400 }
    );
  }

  const doc = await Registration.findById(id).lean();
  if (!doc) {
    return Response.json(
      { ok: false, error: "Registration not found" },
      { status: 404 }
    );
  }

  return Response.json({
    ok: true,
    item: {
      ...doc,
      _id: String(doc._id),
    },
  });
}
