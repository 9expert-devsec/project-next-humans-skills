import mongoose from "mongoose";

const MediaSlideSchema = new mongoose.Schema(
  {
    /* -------- state / control -------- */
    locale: {
      type: String,
      enum: ["th", "en"],
      default: "th",
      index: true,
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    slideType: {
      type: String,
      enum: ["news", "gallery"],
      default: "news",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /* -------- content -------- */
    title: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      default: "",
    },

    linkUrl: {
      type: String,
      default: "",
    },

    readMins: {
      type: Number,
      default: 3,
    },

    /* -------- media -------- */
    imageUrl: {
      type: String,
      required: true,
    },

    imagePublicId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.MediaSlide ||
  mongoose.model("MediaSlide", MediaSlideSchema);
