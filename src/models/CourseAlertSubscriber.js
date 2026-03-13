import mongoose from "mongoose";

const { Schema } = mongoose;

const CourseAlertSubscriberSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    courseSlug: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    emailNorm: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    locale: {
      type: String,
      enum: ["th", "en"],
      default: "th",
      index: true,
    },

    source: {
      type: String,
      enum: ["course_card", "course_detail", "unknown"],
      default: "unknown",
    },

    consentNotify: {
      type: Boolean,
      default: false,
    },

    consentMarketing: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
      index: true,
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },

    unsubscribedAt: {
      type: Date,
      default: null,
    },

    lastNotifiedAt: {
      type: Date,
      default: null,
    },

    lastRoundKey: {
      type: String,
      default: "",
    },

    unsubscribeToken: {
      type: String,
      default: "",
      index: true,
    },
  },
  { timestamps: true },
);

CourseAlertSubscriberSchema.index(
  { courseId: 1, emailNorm: 1 },
  { unique: true },
);

export default mongoose.models.CourseAlertSubscriber ||
  mongoose.model("CourseAlertSubscriber", CourseAlertSubscriberSchema);
