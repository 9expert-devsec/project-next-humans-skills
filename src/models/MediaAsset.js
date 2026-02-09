import mongoose from "mongoose";

const MediaAssetSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["image"], default: "image", index: true },

    url: { type: String, required: true },
    publicId: { type: String, required: true, index: true },

    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    format: { type: String, default: "" },

    folder: { type: String, default: "" },

    alt: { type: String, default: "" },
    caption: { type: String, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ createdAt: -1 });

export default mongoose.models.MediaAsset ||
  mongoose.model("MediaAsset", MediaAssetSchema);
