import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCourse(c) {
  return {
    _id: String(c._id),
    slug: c.slug || "",
    title: c.title_th || c.title_en || "",
    title_th: c.title_th || "",
    title_en: c.title_en || "",
    short: c.short_description || "",
    short_description: c.short_description || "",
    cover: c.cover_image || "",
    cover_image: c.cover_image || "",
    level: c.level || "general",
    duration_days: c.duration_days || 1,
    status: c.status || "draft",
    isActive: !!c.isActive,
  };
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const q = String(searchParams.get("q") || "").trim();
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") || 12)));

  const filter = {
    isActive: true,
    status: "published",
  };

  if (q) {
    filter.$or = [
      { title_th: { $regex: q, $options: "i" } },
      { title_en: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { short_description: { $regex: q, $options: "i" } },
    ];
  }

  const items = await Course.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    ok: true,
    items: items.map(normalizeCourse),
  });
}
