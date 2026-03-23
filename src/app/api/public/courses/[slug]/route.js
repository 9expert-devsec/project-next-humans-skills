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

    short_description: c.short_description || "",
    cover_image: c.cover_image || "",

    level: c.level || "General",
    duration_days: c.duration_days || 1,

    status: c.status || "draft",
    isActive: !!c.isActive,

    isUpcoming: !!c.isUpcoming,
    upcomingTag: c.upcomingTag || "",
    upcomingOrder: Number(c.upcomingOrder || 0),
    upcomingDateText: c.upcomingDateText || "",

    partners: Array.isArray(c.partners) ? c.partners : [],
    tags: Array.isArray(c.tags) ? c.tags : [],

    content: c.content || {
      rationale: "",
      objectives: [],
      target_audience: [],
      benefits: [],
    },

    curriculum: Array.isArray(c.curriculum) ? c.curriculum : [],

    executive_summary: c.executive_summary || "",
    highlight_modules: Array.isArray(c.highlight_modules)
      ? c.highlight_modules
      : [],
    key_takeaways: Array.isArray(c.key_takeaways) ? c.key_takeaways : [],

    business: c.business || {
      price_amount: 0,
      price_currency: "THB",
      vat_type: "",
    },
  };
}

export async function GET(_req, ctx) {
  await dbConnect();
  const { slug } = await ctx.params;

  const safeSlug = decodeURIComponent(clean(slug));

  if (!safeSlug) {
    return NextResponse.json(
      { ok: false, error: "slug is required" },
      { status: 400 },
    );
  }

  const item = await Course.findOne({
    slug: safeSlug,
    isActive: true,
    status: "published",
  }).lean();

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    item: normalizeCourse(item),
  });
}
