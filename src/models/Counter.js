import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // เช่น NX-2025
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Counter ||
  mongoose.model("Counter", CounterSchema);
