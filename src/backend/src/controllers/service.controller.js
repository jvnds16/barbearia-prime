import { Service } from "../models/service.model.js";

const SERVICE_UPDATE_FIELDS = ["name", "price", "duration", "active"];

function pickServiceUpdate(req) {
  return Object.fromEntries(
    SERVICE_UPDATE_FIELDS.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
  );
}

export async function listServices(req, res) {
  const services = await Service.find({ active: true }).sort({ createdAt: 1 }).lean();
  return res.json({ success: true, data: services });
}

export async function createService(req, res) {
  const service = await Service.create(req.body);
  return res.status(201).json({ success: true, data: service.toObject() });
}

export async function updateService(req, res) {
  const service = await Service.findByIdAndUpdate(req.params.id, pickServiceUpdate(req), {
    new: true,
    runValidators: true,
    lean: true
  });

  if (!service) {
    return res.status(404).json({ success: false, error: "Service not found." });
  }

  return res.json({ success: true, data: service });
}

export async function deleteService(req, res) {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true, lean: true }
  );

  if (!service) {
    return res.status(404).json({ success: false, error: "Service not found." });
  }

  return res.json({ success: true, message: "Service deactivated successfully." });
}