import mongoose from "mongoose";
import { Appointment } from "../models/appointment.model.js";
import { HttpError } from "../utils/httpError.js";
import { resolveServiceDetails } from "../services/serviceCatalog.service.js";
import { getAvailableSlots } from "../services/availability.service.js";
import { appointmentToApi } from "../utils/apiSerializers.js";
import { sendData, sendMessage } from "../utils/apiResponse.js";
import {
  BLOCKING_APPOINTMENT_STATUSES,
  VALID_APPOINTMENT_STATUSES,
  createSlotKeys,
  ensureNoAppointmentConflict,
  hasRequiredLeadTime,
  isValidAppointmentDate,
  isValidAppointmentTime,
  isValidCustomerName,
  isValidPhone,
  normalizeText,
  syncAppointmentClient
} from "../services/appointment.service.js";

export async function listAppointments(req, res) {
  const query = {};

  if (req.query.date) query.date = req.query.date;
  if (req.query.status) query.status = req.query.status;
  if (req.query.barber) query.barber = req.query.barber;

  const appointments = await Appointment.find(query)
    .sort({ date: 1, time: 1 })
    .lean();

  return sendData(res, appointments.map(appointmentToApi));
}

export async function listPublicAppointments(req, res) {
  const query = {};

  if (req.query.date) query.date = req.query.date;

  const appointments = await Appointment.find(query)
    .select("date time status durationMinutes")
    .sort({ date: 1, time: 1 })
    .lean();

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return sendData(res, appointments.map(appointmentToApi));
}

export async function createAppointment(req, res) {
  const customerName = normalizeText(req.body.customerName);
  const customerPhone = normalizeText(req.body.customerPhone);
  const serviceName = normalizeText(req.body.serviceName);
  const date = normalizeText(req.body.date);
  const time = normalizeText(req.body.time);
  const barber = req.body.barber;
  const idempotencyKey = normalizeText(req.get("Idempotency-Key") || req.body.idempotencyKey);

  if (idempotencyKey && !/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) {
    throw new HttpError(400, "Invalid idempotency key.");
  }

  if (idempotencyKey) {
    const existing = await Appointment.findOne({ idempotencyKey }).lean();
    if (existing) {
      return sendMessage(
        res,
        "Appointment already registered.",
        appointmentToApi(existing)
      );
    }
  }

  if (!customerName || !customerPhone || !serviceName || !date || !time) {
    throw new HttpError(400, "Fill in all required fields.");
  }

  if (!isValidCustomerName(customerName)) {
    throw new HttpError(400, "Enter first and last name, up to 80 characters.");
  }

  if (!isValidPhone(customerPhone)) {
    throw new HttpError(400, "Invalid phone. Include the area code.");
  }

  if (barber && !mongoose.isValidObjectId(barber)) {
    throw new HttpError(400, "Invalid barber.");
  }

  if (!isValidAppointmentDate(date)) {
    throw new HttpError(400, "Choose a valid date between today and the next 30 days.");
  }

  if (!isValidAppointmentTime(time)) {
    throw new HttpError(400, "Time is outside business hours.");
  }

  if (!hasRequiredLeadTime(time, date)) {
    throw new HttpError(400, "Choose a time at least 30 minutes in advance.");
  }

  const service = await resolveServiceDetails(serviceName);
  if (!service) {
    throw new HttpError(400, "Invalid or unavailable service.");
  }
  await ensureNoAppointmentConflict({
    date,
    time,
    barber,
    durationMinutes: service.durationMinutes
  });

  let appointment;
  try {
    appointment = await Appointment.create({
      customerName,
      customerPhone,
      serviceName,
      price: service.price,
      durationMinutes: service.durationMinutes,
      date,
      time,
      barber,
      status: "pending",
      slotKeys: createSlotKeys({
        date,
        time,
        barber,
        durationMinutes: service.durationMinutes
      }),
      idempotencyKey: idempotencyKey || undefined,
      timestamp: Date.now()
    });
  } catch (error) {
    if (error?.code === 11000 && idempotencyKey) {
      const existing = await Appointment.findOne({ idempotencyKey }).lean();
      if (existing) {
        return sendMessage(
          res,
          "Appointment already registered.",
          appointmentToApi(existing)
        );
      }
    }
    throw error;
  }

  await syncAppointmentClient({ name: customerName, phone: customerPhone });

  return sendMessage(
    res,
    "Appointment saved successfully.",
    appointmentToApi(appointment),
    201
  );
}

export async function updateAppointment(req, res) {
  const id = req.params.id || req.body.id;

  if (!id || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid appointment ID.");
  }

  const updateData = {};
  if (req.body.customerName !== undefined) updateData.customerName = req.body.customerName;
  if (req.body.customerPhone !== undefined) updateData.customerPhone = req.body.customerPhone;
  if (req.body.serviceName !== undefined) updateData.serviceName = req.body.serviceName;
  if (req.body.date !== undefined) updateData.date = req.body.date;
  if (req.body.time !== undefined) updateData.time = req.body.time;
  if (req.body.barber !== undefined) updateData.barber = req.body.barber;
  if (req.body.status !== undefined) updateData.status = req.body.status;

  if (updateData.status !== undefined && !VALID_APPOINTMENT_STATUSES.has(updateData.status)) {
    throw new HttpError(400, "Invalid appointment status.");
  }

  const current = await Appointment.findById(id);
  if (!current) {
    throw new HttpError(404, "Appointment not found.");
  }

  if (updateData.customerPhone) {
    updateData.customerPhone = normalizeText(updateData.customerPhone);
    if (!isValidPhone(updateData.customerPhone)) {
      throw new HttpError(400, "Invalid phone. Include the area code.");
    }
  }

  if (updateData.customerName) {
    updateData.customerName = normalizeText(updateData.customerName);
    if (!isValidCustomerName(updateData.customerName)) {
      throw new HttpError(400, "Enter first and last name, up to 80 characters.");
    }
  }

  if (updateData.date && updateData.date !== current.date && !isValidAppointmentDate(updateData.date)) {
    throw new HttpError(400, "Choose a valid date between today and the next 30 days.");
  }

  if (updateData.time && updateData.time !== current.time && !isValidAppointmentTime(updateData.time)) {
    throw new HttpError(400, "Time is outside business hours.");
  }

  const date = updateData.date || current.date;
  const time = updateData.time || current.time;
  const barber = updateData.barber || current.barber;
  const status = updateData.status || current.status;
  let durationMinutes = current.durationMinutes || 30;

  const appointmentTimeChanged =
    (updateData.date !== undefined && updateData.date !== current.date) ||
    (updateData.time !== undefined && updateData.time !== current.time);
  const barberChanged =
    updateData.barber !== undefined &&
    String(updateData.barber || "") !== String(current.barber || "");
  const serviceChanged =
    updateData.serviceName !== undefined &&
    normalizeText(updateData.serviceName) !== current.serviceName;

  if (appointmentTimeChanged && !hasRequiredLeadTime(time, date)) {
    throw new HttpError(400, "Choose a time at least 30 minutes in advance.");
  }

  if (updateData.serviceName !== undefined) {
    updateData.serviceName = normalizeText(updateData.serviceName);
  }

  if (serviceChanged) {
    const service = await resolveServiceDetails(updateData.serviceName);
    if (!service) {
      throw new HttpError(400, "Invalid or unavailable service.");
    }
    updateData.price = service.price;
    updateData.durationMinutes = service.durationMinutes;
    durationMinutes = service.durationMinutes;
  }

  const reactivatingSlot = ["cancelled", "absent"].includes(current.status);
  if (
    BLOCKING_APPOINTMENT_STATUSES.includes(status) &&
    (appointmentTimeChanged || barberChanged || serviceChanged || reactivatingSlot)
  ) {
    await ensureNoAppointmentConflict({ date, time, barber, durationMinutes, ignoreId: id });
  }

  const slotKeys = createSlotKeys({ date, time, barber, durationMinutes, status });
  let updateOperation;

  if (status === "cancelled") {
    updateOperation = {
      $set: {
        ...updateData,
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: req.user?.name || "Administrator"
      },
      $unset: { slotKey: 1, slotKeys: 1 }
    };
  } else if (status === "absent") {
    updateOperation = {
      $set: { ...updateData, status: "absent" },
      $unset: { slotKey: 1, slotKeys: 1, cancelledAt: 1, cancelledBy: 1 }
    };
  } else {
    updateOperation = {
        $set: { ...updateData, slotKeys },
        $unset: { slotKey: 1, cancelledAt: 1, cancelledBy: 1 }
      };
  }

  const appointment = await Appointment.findByIdAndUpdate(id, updateOperation, {
    new: true,
    runValidators: true
  });

  return sendMessage(
    res,
    "Appointment updated successfully.",
    appointmentToApi(appointment)
  );
}

export async function deleteAppointment(req, res) {
  const id = req.params.id || req.query.id;

  if (!id || !mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid appointment ID.");
  }

  const appointment = await Appointment.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: req.user?.name || "Administrator"
      },
      $unset: { slotKey: 1, slotKeys: 1 }
    },
    { new: true }
  );

  if (!appointment) {
    throw new HttpError(404, "Appointment not found.");
  }

  return sendMessage(
    res,
    "Appointment cancelled successfully.",
    appointmentToApi(appointment)
  );
}

export async function listAvailableSlots(req, res) {
  const { date, barber } = req.query;

  if (!date) {
    throw new HttpError(400, "Date is required to list available time slots.");
  }

  const timeSlots = await getAvailableSlots({ date, barber });
  return sendData(res, timeSlots);
}

