// src/app/api/public/courses/[slug]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCourse(c) {
  return {
    _id: String(c._id),
    slug: c.slug || "",
    title_th: c.title_th || "",
    title_en: c.title_en || "",
    short_description: c.short_description || "",
    cover_image: c.cover_image || "",
    level: c.level || "general",
    duration_days: c.duration_days || 1,
    status: c.status || "draft",
    isActive: !!c.isActive,

    content: c.content || {},
    curriculum: Array.isArray(c.curriculum) ? c.curriculum : [],
    executive_summary: c.executive_summary || "",
    highlight_modules: Array.isArray(c.highlight_modules)
      ? c.highlight_modules
      : [],
    key_takeaways: Array.isArray(c.key_takeaways) ? c.key_takeaways : [],
    business: c.business || {},
    tags: Array.isArray(c.tags) ? c.tags : [],
    partners: Array.isArray(c.partners) ? c.partners : [],
  };
}

export async function GET(_req, ctx) {
  await dbConnect();

  const { slug } = await ctx.params;
  const safeSlug = decodeURIComponent(String(slug || "")).trim();

  if (!safeSlug) {
    return NextResponse.json(
      { ok: false, error: "missing slug" },
      { status: 400 }
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
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, item: normalizeCourse(item) });
}
