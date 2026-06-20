import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true, lowercase: true }
  },
  { timestamps: true, collection: "clients" }
);

export const Client = mongoose.model("Client", clientSchema);
