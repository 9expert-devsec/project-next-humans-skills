// src/models/UpcomingRegistration.js
import mongoose from "mongoose";

const TraineeSchema = new mongoose.Schema(
  {
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" }, // digits
    phone_raw: { type: String, default: "" },
  },
  { _id: false },
);

const UpcomingRegistrationSchema = new mongoose.Schema(
  {
    ref_no: { type: String, unique: true, index: true },

    courseSlug: { type: String, required: true, index: true },
    locale: { type: String, default: "th" },

    coordinator: {
      first_name: { type: String, default: "" },
      last_name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" }, // digits
      phone_raw: { type: String, default: "" },
    },

    trainee_count: { type: Number, default: 1 },
    coordinator_is_trainee: { type: Boolean, default: false },
    no_trainees_yet: { type: Boolean, default: false },
    trainees: { type: [TraineeSchema], default: [] },

    tax: {
      type: {
        type: String,
        enum: ["personal", "company"],
        default: "personal",
      },

      personal_first_name: { type: String, default: "" },
      personal_last_name: { type: String, default: "" },

      company_name: { type: String, default: "" },
      branch: { type: String, default: "สำนักงานใหญ่" },

      tax_id: { type: String, default: "" },
      phone: { type: String, default: "" }, // digits
      phone_raw: { type: String, default: "" },

      address: { type: String, default: "" },
      province: { type: String, default: "" },
      district: { type: String, default: "" },
      subdistrict: { type: String, default: "" },
      postcode: { type: String, default: "" },
    },

    source_channel: {
      type: String,
      enum: [
        "Bitkub Academy",
        "9Expert Training",
        "Key Solutions Training",
        "Other",
        "",
      ],
      default: "",
      index: true,
    },
    source_other: { type: String, default: "" },

    note: { type: String, default: "" },

    status: { type: String, default: "new", index: true }, // new|contacted|done|cancelled
    source: { type: String, default: "web" },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.UpcomingRegistration ||
  mongoose.model("UpcomingRegistration", UpcomingRegistrationSchema);
