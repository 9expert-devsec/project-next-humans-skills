// api/admin/courses/[id]/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

async function ensureUniqueSlugForUpdate(courseId, base) {
  let slug = base;
  let i = 1;
  while (await Course.exists({ slug, _id: { $ne: courseId } })) {
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

function uniq(xs) {
  const out = [];
  const seen = new Set();
  for (const v of xs) {
    const s = cleanStr(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * ✅ Normalize curriculum to support session.partners[]
 * allowCustom=true: อนุญาต custom partner key ได้
 * allowCustom=false: กรองเฉพาะ key ที่อยู่ใน course.partners
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

      return { day: dayNum, title: cleanStr(d?.title), sessions: normSessions };
    })
    .filter((d) => d.day >= 1);
}

function normalizePatch(body = {}, existing = {}) {
  // ใช้ partners ที่ส่งมา (ถ้ามี) ไม่งั้นใช้ของเดิม
  const coursePartners = Array.isArray(body.partners)
    ? arr(body.partners).map(cleanStr).filter(Boolean)
    : arr(existing.partners).map(cleanStr).filter(Boolean);

  const patch = {
    title_th: cleanStr(body?.title_th ?? existing.title_th ?? ""),
    title_en: cleanStr(body?.title_en ?? existing.title_en ?? ""),
    short_description: cleanStr(
      body?.short_description ?? existing.short_description ?? ""
    ),

    level: ["Executive", "Middle Management", "Workforce", "Citizen Developer", "General"].includes(
      body.level
    )
      ? body.level
      : existing.level || "General",
    duration_days: Math.max(
      1,
      Number(body?.duration_days ?? existing.duration_days ?? 1)
    ),

    status: ["draft", "published", "archived"].includes(body.status)
      ? body.status
      : existing.status || "draft",

    isActive:
      typeof body.isActive === "boolean" ? body.isActive : !!existing.isActive,

    cover_image: cleanStr(body?.cover_image ?? existing.cover_image ?? ""),

    tags: Array.isArray(body.tags)
      ? arr(body.tags).map(cleanStr).filter(Boolean)
      : arr(existing.tags),
    partners: coursePartners,

    content: body.content
      ? {
          rationale: cleanStr(
            body?.content?.rationale ?? existing?.content?.rationale ?? ""
          ),
          objectives: arr(
            body?.content?.objectives ?? existing?.content?.objectives
          )
            .map(cleanStr)
            .filter(Boolean),
          target_audience: arr(
            body?.content?.target_audience ?? existing?.content?.target_audience
          )
            .map(cleanStr)
            .filter(Boolean),
          benefits: arr(body?.content?.benefits ?? existing?.content?.benefits)
            .map(cleanStr)
            .filter(Boolean),
        }
      : existing.content || {},

    // ✅ normalize curriculum ถ้าส่งมา
    curriculum: Array.isArray(body.curriculum)
      ? normalizeCurriculum(body.curriculum, coursePartners, true)
      : arr(existing.curriculum),

    executive_summary: cleanStr(
      body?.executive_summary ?? existing.executive_summary ?? ""
    ),
    highlight_modules: Array.isArray(body.highlight_modules)
      ? arr(body.highlight_modules).map(cleanStr).filter(Boolean)
      : arr(existing.highlight_modules),
    key_takeaways: Array.isArray(body.key_takeaways)
      ? arr(body.key_takeaways).map(cleanStr).filter(Boolean)
      : arr(existing.key_takeaways),

    business: body.business
      ? {
          price_amount: Number(
            body?.business?.price_amount ??
              existing?.business?.price_amount ??
              0
          ),
          price_currency:
            cleanStr(
              body?.business?.price_currency ??
                existing?.business?.price_currency ??
                "THB"
            ) || "THB",
          vat_type: ["include", "exclude", ""].includes(
            body?.business?.vat_type
          )
            ? body.business.vat_type
            : existing?.business?.vat_type || "",
          certificate_template:
            body?.business?.certificate_template ??
            existing?.business?.certificate_template ??
            null,
        }
      : existing.business || {},
  };

  return patch;
}

/** flatten object -> dot paths (ยกเว้น business เราจะจัดเอง) */
function flattenForSet(patch = {}) {
  const set = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "business") continue;
    set[k] = v;
  }
  return set;
}

/* ---------------- route ---------------- */
export async function GET(_req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "invalid id" },
      { status: 400 }
    );
  }

  const item = await Course.findById(id).lean();
  if (!item)
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );

  return NextResponse.json({ ok: true, item });
}

export async function PUT(req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "invalid id" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const existing = await Course.findById(id);
  if (!existing)
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );

  const patch = normalizePatch(body, existing.toObject());
  if (!patch.title_th) {
    return NextResponse.json(
      { ok: false, error: "title_th is required" },
      { status: 400 }
    );
  }

  // slug update (ส่งมาก็เปลี่ยน ไม่ส่งมาก็ใช้เดิม)
  const rawSlug = cleanStr(body?.slug);
  if (rawSlug) {
    const base = makeSlug(rawSlug);
    patch.slug = await ensureUniqueSlugForUpdate(existing._id, base);
  }

  // ✅ สร้าง $set แบบ flatten
  const $set = flattenForSet(patch);

  // ✅ business.* set แบบ dot-path เพื่อไม่ชนกับ $unset
  const unset = {};
  if (patch.business && typeof patch.business === "object") {
    $set["business.price_amount"] = patch.business.price_amount ?? 0;
    $set["business.price_currency"] = patch.business.price_currency ?? "THB";
    $set["business.vat_type"] = patch.business.vat_type ?? "";

    const ct = patch.business.certificate_template;

    if (ct === "" || ct === null || (typeof ct === "string" && !ct.trim())) {
      unset["business.certificate_template"] = 1;
    } else if (typeof ct === "string") {
      const s = ct.trim();
      if (!mongoose.Types.ObjectId.isValid(s)) {
        return NextResponse.json(
          { ok: false, error: "invalid business.certificate_template" },
          { status: 400 }
        );
      }
      $set["business.certificate_template"] = new mongoose.Types.ObjectId(s);
    } else {
      const s = String(ct || "");
      if (!mongoose.Types.ObjectId.isValid(s)) {
        return NextResponse.json(
          { ok: false, error: "invalid business.certificate_template" },
          { status: 400 }
        );
      }
      $set["business.certificate_template"] = new mongoose.Types.ObjectId(s);
    }
  }

  const update =
    Object.keys(unset).length > 0 ? { $set, $unset: unset } : { $set };

  const updated = await Course.findByIdAndUpdate(id, update, {
    new: true,
  }).lean();
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "invalid id" },
      { status: 400 }
    );
  }

  const deleted = await Course.findByIdAndDelete(id).lean();
  if (!deleted)
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );

  return NextResponse.json({ ok: true });
}
