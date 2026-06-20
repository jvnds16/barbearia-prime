import mongoose from "mongoose";

const barberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    specialties: [{ type: String, trim: true }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "barbers" }
);

export const Barber = mongoose.model("Barber", barberSchema);
