import dbConnect from "@/lib/dbConnect";
import MediaSlide from "@/models/MediaSlide";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const locale =
    String(searchParams.get("locale") || "th") === "en" ? "en" : "th";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  const items = await MediaSlide.find({ locale, isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .limit(limit)
    .lean();

  return Response.json({ ok: true, items });
}
