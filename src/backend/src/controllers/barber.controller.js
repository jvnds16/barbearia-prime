import { HttpError } from "../utils/httpError.js";
import { barberToApi } from "../utils/apiSerializers.js";
import { sendData, sendMessage } from "../utils/apiResponse.js";
import {
  createBarberRecord,
  deactivateBarberById,
  findActiveBarbers,
  updateBarberById
} from "../services/barber.service.js";

export async function listBarbers(req, res) {
  const barbers = await findActiveBarbers();
  return sendData(res, barbers.map(barberToApi));
}

export async function createBarber(req, res) {
  const { name } = req.body;

  if (!name) {
    throw new HttpError(400, "Barber name is required.");
  }

  const barber = await createBarberRecord({
    name: req.body.name,
    phone: req.body.phone,
    specialties: req.body.specialties,
    active: req.body.active
  });
  return sendData(res, barberToApi(barber), 201);
}

export async function updateBarber(req, res) {
  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.phone !== undefined) updateData.phone = req.body.phone;
  if (req.body.specialties !== undefined) updateData.specialties = req.body.specialties;
  if (req.body.active !== undefined) updateData.active = req.body.active;

  const barber = await updateBarberById(req.params.id, updateData);

  if (!barber) {
    throw new HttpError(404, "Barber not found.");
  }

  return sendData(res, barberToApi(barber));
}

export async function deleteBarber(req, res) {
  const barber = await deactivateBarberById(req.params.id);

  if (!barber) {
    throw new HttpError(404, "Barber not found.");
  }

  return sendMessage(res, "Barber deactivated successfully.");
}
