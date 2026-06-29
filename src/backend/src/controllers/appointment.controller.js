import { Appointment } from "../models/appointment.model.js";
import { resolveServiceDetails } from "../services/serviceCatalog.service.js";
import {
  BLOCKING_APPOINTMENT_STATUSES,
  VALID_APPOINTMENT_STATUSES,
  ensureNoAppointmentConflict,
  hasRequiredLeadTime,
  isValidAppointmentDate,
  isValidAppointmentTime,
  normalizeText
} from "../services/appointment.service.js";

const APPOINTMENT_UPDATE_FIELDS = [
  "customerName",
  "customerPhone",
  "serviceName",
  "date",
  "time",
  "status"
];
const UUID_REGEX = /^[A-Za-z0-9_-]{8,100}$/;

function existingAppointment(idempotencyKey) {
  return idempotencyKey
    ? Appointment.findOne({ idempotencyKey }).lean()
    : Promise.resolve(null);
}

function pickAppointmentUpdate(req) {
  const updateData = {};
  for (const field of APPOINTMENT_UPDATE_FIELDS) {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  }
  return updateData;
}

export async function listAppointments(req, res) {
  const appointments = await Appointment.find(req.query)
    .sort({ date: 1, time: 1 })
    .lean();

  return res.json({ success: true, data: appointments });
}

export async function listPublicAppointments(req, res) {
  const appointments = await Appointment.find(req.query)
    .select("date time status durationMinutes")
    .sort({ date: 1, time: 1 })
    .lean();

  // Public availability must always reflect the latest bookings.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.json({ success: true, data: appointments });
}

export async function createAppointment(req, res) {
  const { customerName, customerPhone, serviceName, date, time } = req.body;
  const idempotencyKey = req.get("Idempotency-Key") || req.body.idempotencyKey || undefined;

  if (idempotencyKey && !UUID_REGEX.test(idempotencyKey)) {
    return res.status(400).json({ success: false, error: "Invalid idempotency key." });
  }

  if (idempotencyKey) {
    // Returning the previous result keeps client retries from creating duplicates.
    const existing = await existingAppointment(idempotencyKey);
    if (existing) {
      return res.json({ success: true, message: "Appointment already registered.", data: existing });
    }
  }

  if (!isValidAppointmentDate(date)) {
    return res.status(400).json({ success: false, error: "Choose a valid date between today and the next 30 days." });
  }

  if (!isValidAppointmentTime(time)) {
    return res.status(400).json({ success: false, error: "Time is outside business hours." });
  }

  if (!hasRequiredLeadTime(time, date)) {
    return res.status(400).json({ success: false, error: "Choose a time at least 30 minutes in advance." });
  }

  const service = await resolveServiceDetails(serviceName);
  if (!service) {
    return res.status(400).json({ success: false, error: "Invalid or unavailable service." });
  }

  // Service duration expands one booking across every occupied 30-minute slot.
  await ensureNoAppointmentConflict({
    date,
    time,
    durationMinutes: service.durationMinutes
  });

  try {
    // Unique idempotency key is the final database-level guard against race conditions.
    const created = await Appointment.create({
      customerName,
      customerPhone,
      serviceName,
      price: service.price,
      durationMinutes: service.durationMinutes,
      date,
      time,
      status: "pending",
      idempotencyKey: idempotencyKey || undefined,
      timestamp: Date.now()
    });
    return res.status(201).json({ success: true, message: "Appointment saved successfully.", data: created.toObject() });
  } catch (error) {
    if (error?.code === 11000 && idempotencyKey) {
      const existing = await existingAppointment(idempotencyKey);
      if (existing) {
        return res.json({ success: true, message: "Appointment already registered.", data: existing });
      }
    }
    throw error;
  }
}

export async function updateAppointment(req, res) {
  const { id } = req.params;
  const updateData = pickAppointmentUpdate(req);

  if (updateData.status !== undefined && !VALID_APPOINTMENT_STATUSES.has(updateData.status)) {
    return res.status(400).json({ success: false, error: "Invalid appointment status." });
  }

  const current = await Appointment.findById(id).lean();
  if (!current) {
    return res.status(404).json({ success: false, error: "Appointment not found." });
  }

  if (updateData.customerPhone) {
    updateData.customerPhone = normalizeText(updateData.customerPhone);
  }

  if (updateData.customerName) {
    updateData.customerName = normalizeText(updateData.customerName);
  }

  if (updateData.serviceName) {
    updateData.serviceName = normalizeText(updateData.serviceName);
  }

  if (updateData.date && updateData.date !== current.date && !isValidAppointmentDate(updateData.date)) {
    return res.status(400).json({ success: false, error: "Choose a valid date between today and the next 30 days." });
  }

  if (updateData.time && updateData.time !== current.time && !isValidAppointmentTime(updateData.time)) {
    return res.status(400).json({ success: false, error: "Time is outside business hours." });
  }

  const date = updateData.date || current.date;
  const time = updateData.time || current.time;
  const status = updateData.status || current.status;
  let durationMinutes = current.durationMinutes || 30;

  const appointmentTimeChanged =
    (updateData.date !== undefined && updateData.date !== current.date) ||
    (updateData.time !== undefined && updateData.time !== current.time);
  const serviceChanged =
    updateData.serviceName !== undefined &&
    normalizeText(updateData.serviceName) !== current.serviceName;

  // Only changes that can occupy a slot need conflict validation.
  if (appointmentTimeChanged && !hasRequiredLeadTime(time, date)) {
    return res.status(400).json({ success: false, error: "Choose a time at least 30 minutes in advance." });
  }

  if (serviceChanged) {
    const service = await resolveServiceDetails(updateData.serviceName);
    if (!service) {
      return res.status(400).json({ success: false, error: "Invalid or unavailable service." });
    }
    updateData.price = service.price;
    updateData.durationMinutes = service.durationMinutes;
    durationMinutes = service.durationMinutes;
  }

  const reactivatingSlot = ["cancelled", "absent"].includes(current.status);
  if (
    BLOCKING_APPOINTMENT_STATUSES.includes(status) &&
    (appointmentTimeChanged || serviceChanged || reactivatingSlot)
  ) {
    await ensureNoAppointmentConflict({ date, time, durationMinutes, ignoreId: id });
  }

  // Cancelled records who/when; other transitions clear that metadata.
  const isCancelled = status === "cancelled";
  const updateOperation = {
    $set: isCancelled
      ? { ...updateData, status: "cancelled", cancelledAt: new Date(), cancelledBy: req.user?.name || "Administrator" }
      : { ...updateData, status },
    ...(isCancelled ? {} : { $unset: { cancelledAt: 1, cancelledBy: 1 } })
  };

  const appointment = await Appointment.findByIdAndUpdate(id, updateOperation, {
    new: true,
    runValidators: true,
    lean: true
  });

  return res.json({ success: true, message: "Appointment updated successfully.", data: appointment });
}

export async function deleteAppointment(req, res) {
  const { id } = req.params;
  const appointment = await Appointment.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: req.user?.name || "Administrator"
      }
    },
    { new: true, lean: true }
  );

  if (!appointment) {
    return res.status(404).json({ success: false, error: "Appointment not found." });
  }

  return res.json({ success: true, message: "Appointment cancelled successfully.", data: appointment });
}
