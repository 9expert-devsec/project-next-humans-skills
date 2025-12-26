import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import slugify from "slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeSlug(s) {
  const base = String(s || "")
    .trim()
    .slice(0, 120);
  const slug = slugify(base, { lower: true, strict: true });
  return slug || "course";
}

async function ensureUniqueSlug(base) {
  let slug = base;
  let i = 1;
  while (await Course.exists({ slug })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

function arr(x) {
  return Array.isArray(x) ? x.filter(Boolean) : [];
}

function normalizeBody(body = {}) {
  return {
    slug: String(body.slug || "").trim(),
    title_th: String(body.title_th || "").trim(),
    title_en: String(body.title_en || "").trim(),
    short_description: String(body.short_description || "").trim(),

    level: ["executive", "middle", "workforce", "citizen", "general"].includes(
      body.level
    )
      ? body.level
      : "general",

    duration_days: Math.max(1, Number(body.duration_days || 1)),

    status: ["draft", "published", "archived"].includes(body.status)
      ? body.status
      : "draft",

    isActive: typeof body.isActive === "boolean" ? body.isActive : true,

    cover_image: String(body.cover_image || "").trim(),

    tags: arr(body.tags),
    partners: arr(body.partners),

    content: {
      rationale: String(body?.content?.rationale || "").trim(),
      objectives: arr(body?.content?.objectives),
      target_audience: arr(body?.content?.target_audience),
      benefits: arr(body?.content?.benefits),
    },

    curriculum: arr(body.curriculum),

    executive_summary: String(body.executive_summary || "").trim(),
    highlight_modules: arr(body.highlight_modules),
    key_takeaways: arr(body.key_takeaways),

    business: {
      price_amount: Number(body?.business?.price_amount || 0),
      price_currency:
        String(body?.business?.price_currency || "THB").trim() || "THB",
      vat_type: ["include", "exclude", ""].includes(body?.business?.vat_type)
        ? body.business.vat_type
        : "",
      certificate_template: body?.business?.certificate_template || null,
    },
  };
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const q = String(searchParams.get("q") || "").trim();
  const status = String(searchParams.get("status") || "").trim(); // draft|published|archived|""
  const isActive = String(searchParams.get("isActive") || "").trim(); // true|false|""

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(5, Number(searchParams.get("limit") || 20))
  );
  const skip = (page - 1) * limit;

  const filter = {};
  if (q) {
    filter.$or = [
      { title_th: { $regex: q, $options: "i" } },
      { title_en: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { short_description: { $regex: q, $options: "i" } },
    ];
  }
  if (["draft", "published", "archived"].includes(status))
    filter.status = status;
  if (isActive === "true") filter.isActive = true;
  if (isActive === "false") filter.isActive = false;

  const [items, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Course.countDocuments(filter),
  ]);

  return NextResponse.json({
    ok: true,
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json().catch(() => ({}));

  const b = normalizeBody(body);

  if (!b.title_th) {
    return NextResponse.json(
      { ok: false, error: "title_th is required" },
      { status: 400 }
    );
  }

  // slug: ถ้าไม่ส่งมา ให้ gen จาก title_th
  const base = makeSlug(b.slug || b.title_th);
  b.slug = await ensureUniqueSlug(base);

  const doc = await Course.create(b);
  return NextResponse.json({ ok: true, item: doc });
}
