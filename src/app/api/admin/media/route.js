import dbConnect from "@/lib/dbConnect";
import MediaSlide from "@/models/MediaSlide";
import { requireAdmin } from "@/lib/adminAuth.server";
import { toJsonError } from "@/lib/apiError";
import { cloudinaryDestroyImage } from "@/lib/cloudinaryAdmin.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const locale =
      String(searchParams.get("locale") || "th") === "en" ? "en" : "th";
    const slideType =
      searchParams.get("type") === "gallery" ? "gallery" : "news";

    const slideTypeOr = [
      { slideType },
      ...(slideType === "news"
        ? [{ slideType: { $exists: false } }, { slideType: null }]
        : []),
    ];

    const query = {
      locale,
      $or: slideTypeOr,
    };

    const items = await MediaSlide.find(query)
      .sort({ order: 1, publishedAt: -1, createdAt: -1 })
      .lean();

    return Response.json({ ok: true, items });
  } catch (err) {
    return toJsonError(err);
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const locale = body?.locale === "en" ? "en" : "th";
    const slideType = body?.slideType === "gallery" ? "gallery" : "news";

    if (!body?.imageUrl) {
      return Response.json(
        { ok: false, error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const last = await MediaSlide.findOne({ locale, slideType })
      .sort({ order: -1 })
      .lean();
    const nextOrder = (last?.order ?? 0) + 1;

    const doc = await MediaSlide.create({
      locale,
      slideType,
      title: String(body?.title || ""),
      caption: String(body?.caption || ""),
      linkUrl: String(body?.linkUrl || ""),
      imageUrl: String(body.imageUrl),
      imagePublicId: String(body?.imagePublicId || ""),
      isActive: body?.isActive !== false,
      order: nextOrder,
      publishedAt: body?.publishedAt ? new Date(body.publishedAt) : new Date(),
      readMins: Math.max(1, Number(body?.readMins || 3)),
    });

    return Response.json({ ok: true, item: doc });
  } catch (err) {
    return toJsonError(err);
  }
}

export async function PUT(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    if (!id) {
      return Response.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const patch = {};
    if ("title" in body) patch.title = String(body.title || "");
    if ("caption" in body) patch.caption = String(body.caption || "");
    if ("linkUrl" in body) patch.linkUrl = String(body.linkUrl || "");
    if ("isActive" in body) patch.isActive = !!body.isActive;
    if ("slideType" in body) {
      patch.slideType = body.slideType === "gallery" ? "gallery" : "news";
    }

    if ("publishedAt" in body) {
      patch.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }
    if ("readMins" in body) {
      patch.readMins = Math.max(1, Number(body.readMins || 1));
    }

    const item = await MediaSlide.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();

    if (!item) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return Response.json({ ok: true, item });
  } catch (err) {
    return toJsonError(err);
  }
}

export async function DELETE(req) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "");
    if (!id) {
      return Response.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const doc = await MediaSlide.findById(id).lean();
    if (!doc) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    await MediaSlide.deleteOne({ _id: id });

    if (doc.imagePublicId) {
      await cloudinaryDestroyImage(doc.imagePublicId);
    }

    return Response.json({ ok: true });
  } catch (err) {
    return toJsonError(err);
  }
}
