// src/models/Course.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const TopicGroupSchema = new Schema(
  {
    title: { type: String, default: "" },
    items: [{ type: String }],
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    period: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: "morning",
    },
    title: { type: String, default: "" },

    partners: [{ type: String }],
    partner: { type: String, default: "" },

    topics: [{ type: String }], // legacy

    // ✅ ใหม่: หัวข้อหลัก + หัวข้อย่อย (แนะนำใช้ตัวนี้)
    topic_groups: { type: [TopicGroupSchema], default: [] },

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

    slug: { type: String, required: true, unique: true, index: true },
    title_th: { type: String, required: true, trim: true },
    title_en: { type: String, default: "", trim: true },
    short_description: { type: String, default: "", trim: true },

    level: {
      type: String,
      enum: [
        "Executive",
        "Middle Management",
        "Workforce",
        "Citizen Developer",
        "General",
      ],
      default: "General",
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
    partners: [{ type: String }], // course-level partners

    content: {
      rationale: { type: String, default: "" },
      objectives: [{ type: String }],
      target_audience: [{ type: String }],
      benefits: [{ type: String }],
    },

    curriculum: [DaySchema],

    executive_summary: { type: String, default: "" },
    highlight_modules: [{ type: String }],
    key_takeaways: [{ type: String }],

    business: {
      price_amount: { type: Number, default: 0 },
      price_currency: { type: String, default: "THB" },
      vat_type: { type: String, enum: ["include", "exclude", ""], default: "" },
      certificate_template: {
        type: Schema.Types.ObjectId,
        ref: "CertificateTemplate",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
