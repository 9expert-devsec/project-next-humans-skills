// src/app/[locale]/admin/courses/[id]/page.jsx
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import { requireAdmin } from "@/lib/adminAuth";
import CourseDetailClient from "./CourseDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCourseDetailPage({ params }) {
  const { locale = "th", id = "" } = (await params) || {};
  const safeLocale = locale === "en" ? "en" : "th";
  const safeId = String(id || "").trim();

  // ✅ กัน id ว่าง/ผิดรูปแบบก่อน (กัน Cast Error)
  if (!safeId || !mongoose.Types.ObjectId.isValid(safeId)) {
    return (
      <div className="ns-shell">
        <div className="ns-card">
          <div className="ns-alert">Invalid course id</div>
        </div>
      </div>
    );
  }

  // ✅ บังคับแอดมิน (อ่าน cookie จาก server ได้ตรง)
  await requireAdmin();

  await dbConnect();
  const ssrItem = await Course.findById(safeId).lean();

  // ส่ง id ที่ชัวร์ + ssrItem ให้ client
  return (
    <div className="ns-shell">
      <div className="ns-card">
        <div className="ns-pageHead">
          <div>
            <div className="ns-title">Course Detail</div>
            <div className="ns-muted">
              ID: <code>{safeId}</code>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <a className="ns-btn" href={`/${safeLocale}/admin/courses`}>
              ← Back
            </a>
            <a
              className="ns-btn"
              href={`/${safeLocale}/admin/courses/${safeId}/edit`}
            >
              Edit
            </a>
          </div>
        </div>

        <CourseDetailClient
          locale={safeLocale}
          id={safeId}
          ssrItem={ssrItem || null}
        />
      </div>
    </div>
  );
}
