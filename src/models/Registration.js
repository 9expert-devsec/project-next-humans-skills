import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    ref_no: { type: String, unique: true, index: true },
    course_code: { type: String, trim: true, uppercase: true, index: true },

    courseSlug: { type: String, required: true, index: true },
    locale: { type: String, default: "th" },

    // section 1
    trainee_count: { type: Number, default: 1 },
    training_location: { type: String, default: "" },
    month_interest: { type: String, default: "" },
    year_interest: { type: String, default: "" },

    // section 2
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    position: { type: String, default: "" },
    department: { type: String, default: "" },
    contact_phone: { type: String, default: "" }, // digits-only
    email: { type: String, default: "" },

    // section 3
    company: { type: String, default: "" },

    // ✅ FIX: branch (required + default)
    branch: {
      type: String,
      default: "สำนักงานใหญ่",
      trim: true,
      required: true,
    },

        // ✅ marketing/source
    source_channel: {
      type: String,
      enum: ["bitkub", "9expert", "key", "other", ""],
      default: "",
      index: true,
    },
    source_other: { type: String, default: "", trim: true },

    tax_id: { type: String, default: "" },
    company_phone: { type: String, default: "" }, // digits-only
    receipt_address: { type: String, default: "" },
    province: { type: String, default: "" },
    district: { type: String, default: "" },
    subdistrict: { type: String, default: "" },
    postcode: { type: String, default: "" },

    // section 4
    note: { type: String, default: "" },

    // meta
    status: {
      type: String,
      default: "new", // new | contacted | quoted | done | cancelled
      index: true,
    },
    source: { type: String, default: "web" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
