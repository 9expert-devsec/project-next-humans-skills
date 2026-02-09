import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import MediaAsset from "@/models/MediaAsset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const mod = await import("@/lib/adminAuth.server");
  if (typeof mod.requireAdmin === "function") return mod.requireAdmin(req);
  throw new Error("requireAdmin() not found in /src/lib/adminAuth.server.js");
}

function clean(x) {
  return String(x || "").trim();
}

export async function GET(req) {
  try {
    await dbConnect();
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const q = clean(searchParams.get("q"));
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      60,
      Math.max(12, Number(searchParams.get("limit") || 24)),
    );
    const skip = (page - 1) * limit;

    const filter = { kind: "image" };
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ alt: re }, { caption: re }, { publicId: re }];
    }

    const [items, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MediaAsset.countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, items, page, limit, total });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
