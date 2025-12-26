import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

async function ensureUniqueSlugForUpdate(courseId, base) {
  let slug = base;
  let i = 1;
  while (
    await Course.exists({
      slug,
      _id: { $ne: courseId },
    })
  ) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

function arr(x) {
  return Array.isArray(x) ? x.filter(Boolean) : [];
}

function normalizePatch(body = {}, existing = {}) {
  return {
    title_th: String(body?.title_th ?? existing.title_th ?? "").trim(),
    title_en: String(body?.title_en ?? existing.title_en ?? "").trim(),
    short_description: String(
      body?.short_description ?? existing.short_description ?? ""
    ).trim(),

    level: ["executive", "middle", "workforce", "citizen", "general"].includes(
      body.level
    )
      ? body.level
      : existing.level || "general",

    duration_days: Math.max(
      1,
      Number(body?.duration_days ?? existing.duration_days ?? 1)
    ),

    status: ["draft", "published", "archived"].includes(body.status)
      ? body.status
      : existing.status || "draft",

    isActive:
      typeof body.isActive === "boolean" ? body.isActive : !!existing.isActive,

    cover_image: String(body?.cover_image ?? existing.cover_image ?? "").trim(),

    tags: Array.isArray(body.tags) ? arr(body.tags) : arr(existing.tags),
    partners: Array.isArray(body.partners)
      ? arr(body.partners)
      : arr(existing.partners),

    content: body.content
      ? {
          rationale: String(
            body?.content?.rationale ?? existing?.content?.rationale ?? ""
          ).trim(),
          objectives: arr(
            body?.content?.objectives ?? existing?.content?.objectives
          ),
          target_audience: arr(
            body?.content?.target_audience ?? existing?.content?.target_audience
          ),
          benefits: arr(body?.content?.benefits ?? existing?.content?.benefits),
        }
      : existing.content || {},

    curriculum: Array.isArray(body.curriculum)
      ? arr(body.curriculum)
      : arr(existing.curriculum),

    executive_summary: String(
      body?.executive_summary ?? existing.executive_summary ?? ""
    ).trim(),
    highlight_modules: Array.isArray(body.highlight_modules)
      ? arr(body.highlight_modules)
      : arr(existing.highlight_modules),
    key_takeaways: Array.isArray(body.key_takeaways)
      ? arr(body.key_takeaways)
      : arr(existing.key_takeaways),

    // เก็บ business เป็น object ก่อน แล้วค่อย flatten ตอน PUT
    business: body.business
      ? {
          price_amount: Number(
            body?.business?.price_amount ??
              existing?.business?.price_amount ??
              0
          ),
          price_currency:
            String(
              body?.business?.price_currency ??
                existing?.business?.price_currency ??
                "THB"
            ).trim() || "THB",
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
}

/** flatten object -> dot paths (ยกเว้น business เราจะจัดเอง) */
function flattenForSet(patch = {}) {
  const set = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "business") continue; // จัดการแยกเอง
    set[k] = v;
  }
  return set;
}

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
  const rawSlug = String(body?.slug || "").trim();
  if (rawSlug) {
    const base = makeSlug(rawSlug);
    patch.slug = await ensureUniqueSlugForUpdate(existing._id, base);
  }

  // ✅ สร้าง $set แบบ flatten
  const $set = flattenForSet(patch);

  // ✅ business.* set แบบ dot-path เพื่อไม่ชนกับ $unset
  const unset = {};
  if (patch.business && typeof patch.business === "object") {
    // set fields อื่น ๆ
    $set["business.price_amount"] = patch.business.price_amount ?? 0;
    $set["business.price_currency"] = patch.business.price_currency ?? "THB";
    $set["business.vat_type"] = patch.business.vat_type ?? "";

    // handle certificate_template
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
