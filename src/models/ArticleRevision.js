import mongoose from "mongoose";

const ArticleRevisionSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },
    snapshotJson: { type: mongoose.Schema.Types.Mixed, default: null },
    snapshotHtml: { type: String, default: "" },
    note: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

export default mongoose.models.ArticleRevision ||
  mongoose.model("ArticleRevision", ArticleRevisionSchema);
