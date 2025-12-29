// /api/admin/courses/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import slugify from "slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */
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

function cleanStr(x) {
  return String(x || "").trim();
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const s = cleanStr(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * ✅ Normalize curriculum to support session.partners (array)
 * - supports legacy session.partner (string)
 * - ensures partners is always array of strings
 *
 * allowCustom=false: จะกรองเฉพาะ key ที่อยู่ใน course.partners (และ/หรือ list ที่ส่งมา)
 * ถ้าคุณอยากให้พิมพ์ custom ได้ ให้เปลี่ยนเป็น true
 */
function normalizeCurriculum(
  curriculumInput,
  coursePartners = [],
  allowCustom = true
) {
  const allow = new Set(uniq(coursePartners));
  const days = Array.isArray(curriculumInput) ? curriculumInput : [];

  return days
    .map((d, idx) => {
      const dayNum = Math.max(1, Number(d?.day || idx + 1));
      const sessions = Array.isArray(d?.sessions) ? d.sessions : [];

      const normSessions = sessions.map((s) => {
        const legacy = cleanStr(s?.partner);
        const fromArr = Array.isArray(s?.partners) ? s.partners : [];
        const merged = uniq([...(fromArr || []), ...(legacy ? [legacy] : [])]);

        const partners = allowCustom
          ? merged
          : merged.filter((k) => allow.has(k));

        return {
          period: cleanStr(s?.period) || "morning",
          title: cleanStr(s?.title),
          partners, // ✅ ใหม่
          partner: legacy, // legacy คงไว้ (optional)
          topics: Array.isArray(s?.topics)
            ? s.topics.map((x) => cleanStr(x)).filter(Boolean)
            : [],
          notes: cleanStr(s?.notes),
        };
      });

      return {
        day: dayNum,
        title: cleanStr(d?.title),
        sessions: normSessions,
      };
    })
    .filter((d) => d.day >= 1);
}

function normalizeBody(body = {}) {
  const partners = arr(body.partners).map(cleanStr).filter(Boolean);

  const out = {
    slug: cleanStr(body.slug),
    title_th: cleanStr(body.title_th),
    title_en: cleanStr(body.title_en),
    short_description: cleanStr(body.short_description),

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

    cover_image: cleanStr(body.cover_image),

    tags: arr(body.tags).map(cleanStr).filter(Boolean),
    partners,

    content: {
      rationale: cleanStr(body?.content?.rationale),
      objectives: arr(body?.content?.objectives).map(cleanStr).filter(Boolean),
      target_audience: arr(body?.content?.target_audience)
        .map(cleanStr)
        .filter(Boolean),
      benefits: arr(body?.content?.benefits).map(cleanStr).filter(Boolean),
    },

    // ✅ normalize curriculum ให้รองรับ partners[]
    curriculum: normalizeCurriculum(body.curriculum, partners, true),

    executive_summary: cleanStr(body.executive_summary),
    highlight_modules: arr(body.highlight_modules)
      .map(cleanStr)
      .filter(Boolean),
    key_takeaways: arr(body.key_takeaways).map(cleanStr).filter(Boolean),

    business: {
      price_amount: Number(body?.business?.price_amount || 0),
      price_currency:
        cleanStr(body?.business?.price_currency || "THB") || "THB",
      vat_type: ["include", "exclude", ""].includes(body?.business?.vat_type)
        ? body.business.vat_type
        : "",
      certificate_template: body?.business?.certificate_template || null,
    },
  };

  return out;
}

/* ---------------- route ---------------- */
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const q = cleanStr(searchParams.get("q"));
  const status = cleanStr(searchParams.get("status")); // draft|published|archived|""
  const isActive = cleanStr(searchParams.get("isActive")); // true|false|""

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
