import mongoose from "mongoose";
import { Appointment } from "../models/appointment.model.js";
import { Client } from "../models/client.model.js";
import { HttpError } from "../utils/httpError.js";
import { gerarHorariosDisponiveis, hojeISO } from "../utils/timeSlots.js";
import { resolveServiceDetails } from "../services/serviceCatalog.service.js";
import { getAvailableSlots } from "../services/availability.service.js";
import { addDaysToISO, businessMinutesNow, isSunday } from "../utils/dateTime.js";
import { appointmentToApi } from "../utils/apiSerializers.js";

const VALID_APPOINTMENT_STATUSES = new Set(["pending", "present", "absent", "cancelled"]);
const BLOCKING_APPOINTMENT_STATUSES = ["pending", "present", "completed"];

function validarTelefone(telefone) {
  const numeros = String(telefone || "").replace(/\D/g, "");
  return /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(numeros);
}

function normalizarTexto(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function validarNome(nome) {
  return nome.length >= 3 && nome.length <= 80 && nome.split(" ").length >= 2;
}

function dataEhValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

  const [ano, mes, dia] = data.split("-").map(Number);
  const parsed = new Date(ano, mes - 1, dia);

  return (
    parsed.getFullYear() === ano &&
    parsed.getMonth() === mes - 1 &&
    parsed.getDate() === dia
  );
}

function dataMaximaISO() {
  return addDaysToISO(hojeISO(), 30);
}

function validarDataAgendamento(data) {
  return dataEhValida(data) && !isSunday(data) && data >= hojeISO() && data <= dataMaximaISO();
}

function validarHorario(horario) {
  return gerarHorariosDisponiveis().includes(horario);
}

function horarioTemAntecedencia(horario, data) {
  if (data !== hojeISO()) return true;

  const [hora, minuto] = horario.split(":").map(Number);
  return hora * 60 + minuto > businessMinutesNow() + 30;
}

function criarSlotKeys({ data, horario, barbeiro, duracaoMinutos = 30, status = "pending" }) {
  if (!BLOCKING_APPOINTMENT_STATUSES.includes(status)) return undefined;

  const [hour, minute] = horario.split(":").map(Number);
  const start = hour * 60 + minute;
  const slots = Math.ceil(duracaoMinutos / 30);

  return Array.from({ length: slots }, (_, index) => {
    const slotMinutes = start + index * 30;
    const slotHour = String(Math.floor(slotMinutes / 60)).padStart(2, "0");
    const slotMinute = String(slotMinutes % 60).padStart(2, "0");
    return `${data}|${slotHour}:${slotMinute}|${barbeiro || "principal"}`;
  });
}

async function ensureNoConflict({ data, horario, barbeiro, duracaoMinutos = 30, ignoreId }) {
  const requestedSlots = criarSlotKeys({ data, horario, barbeiro, duracaoMinutos });
  const query = {
    date: data,
    status: { $in: BLOCKING_APPOINTMENT_STATUSES }
  };

  if (barbeiro) query.barber = barbeiro;
  if (ignoreId) query._id = { $ne: ignoreId };

  const appointments = await Appointment.find(query)
    .select("time durationMinutes")
    .lean();
  const requested = new Set(requestedSlots);
  const exists = appointments.some((appointment) => {
    const occupiedSlots = criarSlotKeys({
      data,
      horario: appointment.time,
      barbeiro,
      duracaoMinutos: appointment.durationMinutes || 30
    });
    return occupiedSlots.some((slot) => requested.has(slot));
  });

  if (exists) {
    throw new HttpError(409, "This time slot is already booked.");
  }
}

export async function listAppointments(req, res) {
  const query = {};

  if (req.query.date) query.date = req.query.date;
  if (req.query.status) query.status = req.query.status;
  if (req.query.barber) query.barber = req.query.barber;

  const appointments = await Appointment.find(query)
    .sort({ date: 1, time: 1 })
    .lean();

  res.json({ success: true, data: appointments.map(appointmentToApi) });
}

export async function listPublicSchedule(req, res) {
  const query = {};

  if (req.query.date) query.date = req.query.date;

  const appointments = await Appointment.find(query)
    .select("date time status durationMinutes")
    .sort({ date: 1, time: 1 })
    .lean();

  res.json({ success: true, data: appointments.map(appointmentToApi) });
}

export async function createAppointment(req, res) {
  const nome = normalizarTexto(req.body.customerName);
  const telefone = normalizarTexto(req.body.customerPhone);
  const servico = normalizarTexto(req.body.serviceName);
  const data = normalizarTexto(req.body.date);
  const horario = normalizarTexto(req.body.time);
  const barbeiro = req.body.barber;
  const idempotencyKey = normalizarTexto(req.get("Idempotency-Key") || req.body.idempotencyKey);

  if (idempotencyKey && !/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) {
    throw new HttpError(400, "Invalid idempotency key.");
  }

  if (idempotencyKey) {
    const existing = await Appointment.findOne({ idempotencyKey }).lean();
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Appointment already registered.",
        data: appointmentToApi(existing)
      });
    }
  }

  if (!nome || !telefone || !servico || !data || !horario) {
    throw new HttpError(400, "Fill in all required fields.");
  }

  if (!validarNome(nome)) {
    throw new HttpError(400, "Enter first and last name, up to 80 characters.");
  }

  if (!validarTelefone(telefone)) {
    throw new HttpError(400, "Invalid phone. Include the area code.");
  }

  if (barbeiro && !mongoose.isValidObjectId(barbeiro)) {
    throw new HttpError(400, "Invalid barber.");
  }

  if (!validarDataAgendamento(data)) {
    throw new HttpError(400, "Choose a valid date between today and the next 30 days.");
  }

  if (!validarHorario(horario)) {
    throw new HttpError(400, "Time is outside business hours.");
  }

  if (!horarioTemAntecedencia(horario, data)) {
    throw new HttpError(400, "Choose a time at least 30 minutes in advance.");
  }

  const service = await resolveServiceDetails(servico);
  if (!service) {
    throw new HttpError(400, "Invalid or unavailable service.");
  }
  await ensureNoConflict({
    data,
    horario,
    barbeiro,
    duracaoMinutos: service.durationMinutes
  });

  let appointment;
  try {
    appointment = await Appointment.create({
      customerName: nome,
      customerPhone: telefone,
      serviceName: servico,
      price: service.price,
      durationMinutes: service.durationMinutes,
      date: data,
      time: horario,
      barber: barbeiro,
      status: "pending",
      slotKeys: criarSlotKeys({
        data,
        horario,
        barbeiro,
        duracaoMinutos: service.durationMinutes
      }),
      idempotencyKey: idempotencyKey || undefined,
      timestamp: Date.now()
    });
  } catch (error) {
    if (error?.code === 11000 && idempotencyKey) {
      const existing = await Appointment.findOne({ idempotencyKey }).lean();
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Appointment already registered.",
          data: appointmentToApi(existing)
        });
      }
    }
    throw error;
  }

  try {
    await Client.findOneAndUpdate(
      { phone: telefone },
      { name: nome, phone: telefone },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    if (error?.code === 11000) {
      await Client.updateOne({ phone: telefone }, { name: nome });
    } else {
      console.error("Could not synchronize the client record:", error);
    }
  }

  res.status(201).json({
    success: true,
    message: "Appointment saved successfully.",
    data: appointmentToApi(appointment)
  });
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
    updateData.customerPhone = normalizarTexto(updateData.customerPhone);
    if (!validarTelefone(updateData.customerPhone)) {
      throw new HttpError(400, "Invalid phone. Include the area code.");
    }
  }

  if (updateData.customerName) {
    updateData.customerName = normalizarTexto(updateData.customerName);
    if (!validarNome(updateData.customerName)) {
      throw new HttpError(400, "Enter first and last name, up to 80 characters.");
    }
  }

  if (updateData.date && updateData.date !== current.date && !validarDataAgendamento(updateData.date)) {
    throw new HttpError(400, "Choose a valid date between today and the next 30 days.");
  }

  if (updateData.time && updateData.time !== current.time && !validarHorario(updateData.time)) {
    throw new HttpError(400, "Time is outside business hours.");
  }

  const data = updateData.date || current.date;
  const horario = updateData.time || current.time;
  const barbeiro = updateData.barber || current.barber;
  const status = updateData.status || current.status;
  let duracaoMinutos = current.durationMinutes || 30;

  const scheduleChanged =
    (updateData.date !== undefined && updateData.date !== current.date) ||
    (updateData.time !== undefined && updateData.time !== current.time);
  const barberChanged =
    updateData.barber !== undefined &&
    String(updateData.barber || "") !== String(current.barber || "");
  const serviceChanged =
    updateData.serviceName !== undefined &&
    normalizarTexto(updateData.serviceName) !== current.serviceName;

  if (scheduleChanged && !horarioTemAntecedencia(horario, data)) {
    throw new HttpError(400, "Choose a time at least 30 minutes in advance.");
  }

  if (updateData.serviceName !== undefined) {
    updateData.serviceName = normalizarTexto(updateData.serviceName);
  }

  if (serviceChanged) {
    const service = await resolveServiceDetails(updateData.serviceName);
    if (!service) {
      throw new HttpError(400, "Invalid or unavailable service.");
    }
    updateData.price = service.price;
    updateData.durationMinutes = service.durationMinutes;
    duracaoMinutos = service.durationMinutes;
  }

  const reactivatingSlot = ["cancelled", "absent"].includes(current.status);
  if (
    BLOCKING_APPOINTMENT_STATUSES.includes(status) &&
    (scheduleChanged || barberChanged || serviceChanged || reactivatingSlot)
  ) {
    await ensureNoConflict({ data, horario, barbeiro, duracaoMinutos, ignoreId: id });
  }

  const slotKeys = criarSlotKeys({ data, horario, barbeiro, duracaoMinutos, status });
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

  res.json({
    success: true,
    message: "Appointment updated successfully.",
    data: appointmentToApi(appointment)
  });
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

  res.json({
    success: true,
    message: "Appointment cancelled successfully.",
    data: appointmentToApi(appointment)
  });
}

export async function listAvailableSlots(req, res) {
  const { date, barber } = req.query;

  if (!date) {
    throw new HttpError(400, "Date is required to list available time slots.");
  }

  const horarios = await getAvailableSlots({ data: date, barbeiro: barber });
  res.json({ success: true, data: horarios });
}

