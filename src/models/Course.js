// src/models/Course.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/** helper: normalize session partners (รองรับข้อมูลเก่า partner:string) */
function normalizePartners(s) {
  const arr = Array.isArray(s?.partners)
    ? s.partners.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const legacy = String(s?.partner || "").trim();
  if (arr.length) return arr;
  if (legacy) return [legacy];
  return [];
}

const SessionSchema = new Schema(
  {
    period: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: "morning",
    },
    title: { type: String, default: "" },

    /**
     * ✅ ใหม่: partners เลือกได้หลายอันต่อ session
     * - ค่าใน array เป็น key เช่น "bitkub" | "9expert" | "key"
     */
    partners: [{ type: String, default: "" }],

    /**
     * ✅ ของเดิม (legacy) — เก็บไว้เพื่อ backward compatibility
     * ถ้าคุณพร้อม migrate แล้วค่อยลบทิ้งได้
     */
    partner: { type: String, default: "" },

    topics: [{ type: String }],
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const DaySchema = new Schema(
  {
    day: { type: Number, required: true }, // 1..n
    title: { type: String, default: "" },
    sessions: [SessionSchema],
  },
  { _id: false }
);

const CourseSchema = new Schema(
  {
    course_code: { type: String, trim: true, uppercase: true, index: true },

    // core
    slug: { type: String, required: true, unique: true, index: true },
    title_th: { type: String, required: true, trim: true },
    title_en: { type: String, default: "", trim: true },
    short_description: { type: String, default: "", trim: true },

    level: {
      type: String,
      enum: ["executive", "middle", "workforce", "citizen", "general"],
      default: "general",
      index: true,
    },

    duration_days: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },

    cover_image: { type: String, default: "" },

    tags: [{ type: String }],
    partners: [{ type: String }], // ["bitkub","9expert","key"]

    // content
    content: {
      rationale: { type: String, default: "" }, // หลักการและเหตุผล
      objectives: [{ type: String }],
      target_audience: [{ type: String }],
      benefits: [{ type: String }],
    },

    // curriculum
    curriculum: [DaySchema],

    // executive / marketing
    executive_summary: { type: String, default: "" },
    highlight_modules: [{ type: String }],
    key_takeaways: [{ type: String }],

    // business
    business: {
      price_amount: { type: Number, default: 0 },
      price_currency: { type: String, default: "THB" },
      vat_type: { type: String, enum: ["include", "exclude", ""], default: "" },
      certificate_template: {
        type: Schema.Types.ObjectId,
        ref: "CertificateTemplate",
      }, // เผื่ออนาคต
    },
  },
  { timestamps: true }
);

/**
 * ✅ Auto-migrate-in-memory:
 * เวลา save ถ้าเจอ session เก่าที่มี partner แต่ไม่มี partners
 * จะเติม partners ให้เอง
 */
CourseSchema.pre("validate", function (next) {
  try {
    const cur = Array.isArray(this.curriculum) ? this.curriculum : [];
    cur.forEach((day) => {
      const sessions = Array.isArray(day?.sessions) ? day.sessions : [];
      sessions.forEach((s) => {
        const partners = normalizePartners(s);
        s.partners = partners;
        // ไม่บังคับลบ partner เพื่อ compatibility
      });
    });
  } catch {}
  next();
});

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
