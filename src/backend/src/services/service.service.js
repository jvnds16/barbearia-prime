import { Service } from "../models/service.model.js";

export function findActiveServices() {
  return Service.find({ active: true }).sort({ createdAt: 1 }).lean();
}

export function createServiceRecord(data) {
  return Service.create(data);
}

export function updateServiceById(id, data) {
  return Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export function deactivateServiceById(id) {
  return Service.findByIdAndUpdate(id, { active: false }, { new: true });
}
