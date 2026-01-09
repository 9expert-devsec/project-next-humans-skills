import dbConnect from "@/lib/dbConnect";
import MediaSlide from "@/models/MediaSlide";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const locale =
      String(searchParams.get("locale") || "th") === "en" ? "en" : "th";
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

    // base query
    const query = {
      locale,
    };

    // รองรับทั้ง published / isActive (กัน schema ต่างเวอร์ชัน)
    query.$or = [
      { published: true },
      { isActive: true },
      { published: { $exists: false }, isActive: { $exists: false } },
    ];

    const items = await MediaSlide.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    // กรอง slide ที่ไม่มีรูปออก (กัน UI พัง)
    const safeItems = items.filter((x) => !!x.imageUrl);

    return Response.json({ ok: true, items: safeItems });
  } catch (err) {
    console.error("[public/media] error", err);
    return Response.json(
      { ok: false, message: "Failed to load media" },
      { status: 500 }
    );
  }
}
