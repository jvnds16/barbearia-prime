import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    serviceName: { type: String, required: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 1, default: 30 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    status: {
      type: String,
      enum: ["pending", "present", "absent", "cancelled"],
      default: "pending"
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      select: false
    },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, trim: true },
    timestamp: { type: Number, default: () => Date.now() }
  },
  { timestamps: true, collection: "appointments" }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
