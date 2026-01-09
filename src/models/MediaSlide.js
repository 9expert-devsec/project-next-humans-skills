import mongoose from "mongoose";

const MediaSlideSchema = new mongoose.Schema(
  {
    locale: { type: String, enum: ["th", "en"], default: "th", index: true },

    title: { type: String, default: "" },
    caption: { type: String, default: "" },
    linkUrl: { type: String, default: "" },

    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, default: "" }, // สำหรับลบจาก Cloudinary ถ้าต้องการ

    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },

    publishedAt: { type: Date, default: Date.now, index: true },
    readMins: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export default mongoose.models.MediaSlide ||
  mongoose.model("MediaSlide", MediaSlideSchema);
