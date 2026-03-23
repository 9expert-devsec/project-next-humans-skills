import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

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

    level: c.level || "General",
    duration_days: c.duration_days || 1,

    status: c.status || "draft",
    isActive: !!c.isActive,

    isUpcoming: !!c.isUpcoming,
    upcomingTag: c.upcomingTag || "",
    upcomingOrder: Number(c.upcomingOrder || 0),
    upcoming_date_text: c.upcomingDateText || "",

    // ✅ location สำหรับการ์ด upcoming
    upcoming_location: c.upcomingLocation || "",
    upcomingLocation: c.upcomingLocation || "",

    // ✅ ราคา
    full_price: Number(c?.business?.price_amount || 0),
    fullPrice: Number(c?.business?.price_amount || 0),

    earlybird_price: Number(c?.business?.earlybird_price || 0),
    earlybirdPrice: Number(c?.business?.earlybird_price || 0),

    currency: c?.business?.price_currency || "THB",
    price_currency: c?.business?.price_currency || "THB",
  };
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const q = clean(searchParams.get("q"));
  const limit = Math.min(
    48,
    Math.max(1, Number(searchParams.get("limit") || 12)),
  );
  const onlyUpcoming = clean(searchParams.get("upcoming")) === "1";

  const filter = {
    isActive: true,
    status: "published",
  };

  if (onlyUpcoming) {
    filter.isUpcoming = true;
  }

  if (q) {
    filter.$or = [
      { title_th: { $regex: q, $options: "i" } },
      { title_en: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { short_description: { $regex: q, $options: "i" } },
      { upcomingDateText: { $regex: q, $options: "i" } },
      { upcomingLocation: { $regex: q, $options: "i" } },
    ];
  }

  const sort = onlyUpcoming
    ? { upcomingOrder: 1, createdAt: -1 }
    : { createdAt: -1 };

  const items = await Course.find(filter).sort(sort).limit(limit).lean();

  return NextResponse.json({
    ok: true,
    items: items.map(normalizeCourse),
  });
}
