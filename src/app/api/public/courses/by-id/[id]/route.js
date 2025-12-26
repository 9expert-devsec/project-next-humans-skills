import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  await dbConnect();
  const id = String(params.id || "").trim();

  const item = await Course.findById(id).lean();
  if (!item || !item.isActive)
    return Response.json({ ok: false }, { status: 404 });

  return Response.json({ ok: true, item });
}
