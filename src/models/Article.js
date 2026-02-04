import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" },
  },
  { _id: false },
);

const SeoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    ogImageUrl: { type: String, default: "" },
    canonical: { type: String, default: "" },
  },
  { _id: false },
);

/* ✅ NEW: Media schema (video/audio + attachments) */
const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    bytes: { type: Number, default: 0 },
    mime: { type: String, default: "" },
  },
  { _id: false },
);

const MediaSchema = new mongoose.Schema(
  {
    youtubeUrl: { type: String, default: "" }, // for video
    audioUrl: { type: String, default: "" }, // for audio
    audioPublicId: { type: String, default: "" },
    transcriptText: { type: String, default: "" },
    attachments: { type: [AttachmentSchema], default: [] }, // optional downloads
  },
  { _id: false },
);

const ArticleSchema = new mongoose.Schema(
  {
    locale: { type: String, enum: ["th", "en"], default: "th", index: true },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, index: true },

    excerpt: { type: String, default: "" },
    coverImage: { type: ImageSchema, default: () => ({}) },

    /* ✅ NEW: kind/type */
    kind: {
      type: String,
      enum: ["article", "video", "audio"],
      default: "article",
      index: true,
    },
    /* ✅ NEW: media payload */
    media: { type: MediaSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null, index: true },

    tags: { type: [String], default: [], index: true },
    category: { type: String, default: "" },

    // Lexical payloads
    contentJson: { type: mongoose.Schema.Types.Mixed, default: null },
    contentHtml: { type: String, default: "" },
    contentText: { type: String, default: "" },

    readMins: { type: Number, default: 0 },
    toc: { type: [Object], default: [] }, // [{id,text,level}]

    seo: { type: SeoSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

ArticleSchema.index({ locale: 1, slug: 1 }, { unique: true });
ArticleSchema.index({ title: "text", excerpt: "text", contentText: "text" });

export default mongoose.models.Article ||
  mongoose.model("Article", ArticleSchema);
