import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Article from "@/models/Article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const locale = searchParams.get("locale") === "en" ? "en" : "th";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      24,
      Math.max(6, Number(searchParams.get("limit") || 12)),
    );
    const skip = (page - 1) * limit;

    const q = clean(searchParams.get("q"));
    const tag = clean(searchParams.get("tag"));
    const category = clean(searchParams.get("category"));

    const now = new Date();

    const filter = {
      locale,
      status: "published",
      publishedAt: { $ne: null, $lte: now },
    };
    if (tag) filter.tags = tag;
    if (category) filter.category = category;

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { excerpt: rx }];
    }

    const [items, total] = await Promise.all([
      Article.find(filter)
        .select(
          "title slug excerpt coverImage publishedAt readMins tags category kind",
        )
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, items, page, limit, total });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
