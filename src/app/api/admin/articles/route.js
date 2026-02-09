import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Article from "@/models/Article";
import slugify from "slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(x) {
  return String(x || "").trim();
}
function makeSlug(s) {
  const base = clean(s).slice(0, 120);
  const slug = slugify(base, { lower: true, strict: true });
  return slug || "article";
}

async function ensureUniqueSlug(locale, baseSlug, ignoreId = null) {
  let slug = baseSlug;
  let i = 1;
  while (true) {
    const q = { locale, slug };
    if (ignoreId) q._id = { $ne: ignoreId };
    const exists = await Article.exists(q);
    if (!exists) return slug;
    i += 1;
    slug = `${baseSlug}-${i}`;
  }
}

// ปรับให้ตรงกับของคุณ (ในโปรเจคคุณมี adminAuth.server.js อยู่แล้ว)
async function requireAdmin(req) {
  const mod = await import("@/lib/adminAuth.server");
  if (typeof mod.requireAdmin === "function") return mod.requireAdmin(req);
  throw new Error("requireAdmin() not found in /src/lib/adminAuth.server.js");
}

export async function GET(req) {
  try {
    await dbConnect();
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const q = clean(searchParams.get("q"));
    const status = clean(searchParams.get("status"));
    const locale = searchParams.get("locale") === "en" ? "en" : "th";

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      50,
      Math.max(10, Number(searchParams.get("limit") || 20)),
    );
    const skip = (page - 1) * limit;

    const filter = { locale };
    if (status && ["draft", "published", "archived"].includes(status))
      filter.status = status;

    if (q) {
      filter.$or = [
        { title: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { excerpt: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { slug: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const [items, total] = await Promise.all([
      Article.find(filter)
        .sort({ updatedAt: -1 })
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

export async function POST(req) {
  try {
    await dbConnect();
    const admin = await requireAdmin(req);

    const body = await req.json();
    const locale = body?.locale === "en" ? "en" : "th";

    const title =
      clean(body?.title) || (locale === "en" ? "Untitled" : "ยังไม่มีชื่อ");
    const base = makeSlug(body?.slug || title);
    const slug = await ensureUniqueSlug(locale, base);

    const doc = await Article.create({
      locale,
      title,
      slug,
      status: "draft",
      createdBy: admin?._id,
      updatedBy: admin?._id,
    });

    return NextResponse.json({ ok: true, item: doc });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
