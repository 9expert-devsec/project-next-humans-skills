import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await dbConnect();

  const now = new Date();

  const samples = [
    {
      slug: "nextjs-basic",
      titleTh: "Next.js สำหรับผู้เริ่มต้น",
      titleEn: "Next.js for Beginners",
      shortTh: "เริ่มจากพื้นฐาน สร้างเว็บด้วย App Router",
      shortEn: "Start from scratch with the App Router",
      detailTh: "เนื้อหาครอบคลุม Routing, API Routes, Deploy",
      detailEn: "Covers routing, API routes, and deployment",
      coverUrl: "https://res.cloudinary.com/ddva7xvdt/image/upload/v1764665549/online/covers/cuwtwazt2mtj9o8hb3zg.webp", // ใส่ Cloudinary URL ได้
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      slug: "powerbi-dashboard",
      titleTh: "Power BI Dashboard",
      titleEn: "Power BI Dashboard",
      shortTh: "สร้างรายงานและแดชบอร์ดแบบมืออาชีพ",
      shortEn: "Build professional reports and dashboards",
      detailTh: "DAX, Data Model, Visual best practices",
      detailEn: "DAX, data modeling, visual best practices",
      coverUrl: "https://res.cloudinary.com/ddva7xvdt/image/upload/v1764588536/online/covers/qnbwdywggpihrzu1qx6w.webp",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // กันซ้ำด้วย slug
  const results = [];
  for (const s of samples) {
    const existed = await Course.findOne({ slug: s.slug }).lean();
    if (existed) {
      results.push({ slug: s.slug, status: "skip" });
      continue;
    }
    await Course.create(s);
    results.push({ slug: s.slug, status: "created" });
  }

  return Response.json({ ok: true, results });
}
