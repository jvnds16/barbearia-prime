import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "services" }
);

export const Service = mongoose.model("Service", serviceSchema);
