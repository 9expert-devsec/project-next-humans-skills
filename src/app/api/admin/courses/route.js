// src/app/api/admin/courses/route.js
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

async function ensureUniqueSlug(base, excludeId = "") {
  let slug = base;
  let i = 1;

  // กันชน: ถ้า edit แล้ว slug เดิมของตัวเอง ให้ผ่านได้
  // ใช้ while loop ตรวจว่ามี slug ชนกับคนอื่นไหม
  // excludeId: ถ้ามี จะตรวจว่า doc ที่ชนเป็นคนละ _id
  // (ถ้าไม่มี excludeId -> create mode ปกติ)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Course.findOne({ slug }).select({ _id: 1 }).lean();
    if (!exists) break;
    if (excludeId && String(exists._id) === String(excludeId)) break;

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

function uniq(list) {
  const out = [];
  const seen = new Set();
  for (const v of Array.isArray(list) ? list : []) {
    const s = cleanStr(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/* ---------------- topic groups ---------------- */
function normalizeTopicGroups(input) {
  const groups = Array.isArray(input) ? input : [];
  return groups
    .map((g) => {
      const title = cleanStr(g?.title);
      const items = Array.isArray(g?.items)
        ? g.items.map((x) => cleanStr(x)).filter(Boolean)
        : [];
      return { title, items };
    })
    .filter((g) => g.title || (g.items && g.items.length));
}

/* ---------------- curriculum ---------------- */
/**
 * ✅ Normalize curriculum to support:
 * - session.partners (array)
 * - legacy session.partner (string) -> merge เข้า partners
 * - session.topic_groups (array of {title, items})
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
        const topic_groups = normalizeTopicGroups(s?.topic_groups);

        return {
          period: cleanStr(s?.period) || "morning",
          title: cleanStr(s?.title),
          partners, // ✅ ใหม่
          partner: legacy, // legacy คงไว้ (optional)
          topics: Array.isArray(s?.topics)
            ? s.topics.map((x) => cleanStr(x)).filter(Boolean)
            : [],
          topic_groups, // ✅ ใหม่
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

  return {
    id: cleanStr(body.id),

    slug: cleanStr(body.slug),
    title_th: cleanStr(body.title_th),
    title_en: cleanStr(body.title_en),
    short_description: cleanStr(body.short_description),

    level: [
      "Executive",
      "Middle Management",
      "Workforce",
      "Citizen Developer",
      "General",
    ].includes(body.level)
      ? body.level
      : "General",

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

  // ไม่ต้องส่ง id เข้า create
  delete b.id;

  const doc = await Course.create(b);
  return NextResponse.json({ ok: true, item: doc });
}

export async function PUT(req) {
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const b = normalizeBody(body);

  const id = cleanStr(b.id);
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id is required" },
      { status: 400 }
    );
  }

  if (!b.title_th) {
    return NextResponse.json(
      { ok: false, error: "title_th is required" },
      { status: 400 }
    );
  }

  // slug: ถ้าไม่ส่งมา ให้ gen จาก title_th
  const base = makeSlug(b.slug || b.title_th);
  b.slug = await ensureUniqueSlug(base, id);

  delete b.id;

  const updated = await Course.findByIdAndUpdate(id, b, { new: true }).lean();
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, item: updated });
}
