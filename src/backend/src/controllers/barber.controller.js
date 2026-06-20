import { Barber } from "../models/barber.model.js";
import { HttpError } from "../utils/httpError.js";
import { barberToApi } from "../utils/apiSerializers.js";

export async function listBarbers(req, res) {
  const barbers = await Barber.find({ active: true }).sort({ name: 1 }).lean();
  res.json({ success: true, data: barbers.map(barberToApi) });
}

export async function createBarber(req, res) {
  const { name } = req.body;

  if (!name) {
    throw new HttpError(400, "Barber name is required.");
  }

  const barber = await Barber.create({
    name: req.body.name,
    phone: req.body.phone,
    specialties: req.body.specialties,
    active: req.body.active
  });
  res.status(201).json({ success: true, data: barberToApi(barber) });
}

export async function updateBarber(req, res) {
  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.phone !== undefined) updateData.phone = req.body.phone;
  if (req.body.specialties !== undefined) updateData.specialties = req.body.specialties;
  if (req.body.active !== undefined) updateData.active = req.body.active;

  const barber = await Barber.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  if (!barber) {
    throw new HttpError(404, "Barber not found.");
  }

  res.json({ success: true, data: barberToApi(barber) });
}

export async function deleteBarber(req, res) {
  const barber = await Barber.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!barber) {
    throw new HttpError(404, "Barber not found.");
  }

  res.json({ success: true, message: "Barber deactivated successfully." });
}
