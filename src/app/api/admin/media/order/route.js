import dbConnect from "@/lib/dbConnect";
import MediaSlide from "@/models/MediaSlide";
import { requireAdmin } from "@/lib/adminAuth.server";
import { toJsonError } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return Response.json(
        { ok: false, error: "ids[] required" },
        { status: 400 }
      );
    }

    const ops = ids.map((id, idx) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: idx + 1 } } },
    }));

    await MediaSlide.bulkWrite(ops);
    return Response.json({ ok: true });
  } catch (err) {
    return toJsonError(err);
  }
}
