import mongoose from "mongoose";

const { Schema } = mongoose;

const TopicGroupSchema = new Schema(
  {
    title: { type: String, default: "" },
    items: [{ type: String }],
  },
  { _id: false },
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

    topics: [{ type: String }],
    topic_groups: { type: [TopicGroupSchema], default: [] },

    notes: { type: String, default: "" },
  },
  { _id: false },
);

const DaySchema = new Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, default: "" },
    sessions: [SessionSchema],
  },
  { _id: false },
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

    isUpcoming: { type: Boolean, default: false, index: true },
    upcomingOrder: { type: Number, default: 0, index: true },

    // ✅ tag สำหรับ section คลาสที่กำลังจะมาถึง
    upcomingTag: {
      type: String,
      enum: ["", "open", "nearly_full", "full"],
      default: "",
      index: true,
    },

    // ✅ ข้อความวันอบรมสำหรับ public / email เช่น "10 มี.ค. 2569" หรือ "2 - 3 Dec 2026"
    upcomingDateText: { type: String, default: "", trim: true },

    // ✅ สถานที่รอบ Public / Upcoming สำหรับแสดงบนการ์ด
    upcomingLocation: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },

    cover_image: { type: String, default: "" },

    tags: [{ type: String }],
    partners: [{ type: String }],

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
      // ✅ ราคาเต็ม
      price_amount: { type: Number, default: 0 },

      // ✅ ราคา early bird
      earlybird_price: { type: Number, default: 0 },

      price_currency: { type: String, default: "THB" },
      vat_type: {
        type: String,
        enum: ["include", "exclude", ""],
        default: "",
      },
      certificate_template: {
        type: Schema.Types.ObjectId,
        ref: "CertificateTemplate",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
