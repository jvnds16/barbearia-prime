import { Barber } from "../models/barber.model.js";

export function findActiveBarbers() {
  return Barber.find({ active: true }).sort({ name: 1 }).lean();
}

export function createBarberRecord(data) {
  return Barber.create(data);
}

export function updateBarberById(id, data) {
  return Barber.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export function deactivateBarberById(id) {
  return Barber.findByIdAndUpdate(id, { active: false }, { new: true });
}
