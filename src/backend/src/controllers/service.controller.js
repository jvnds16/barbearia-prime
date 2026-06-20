import { Service } from "../models/service.model.js";
import { HttpError } from "../utils/httpError.js";
import { serviceToApi } from "../utils/apiSerializers.js";

export async function listServices(req, res) {
  const services = await Service.find({ active: true }).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: services.map(serviceToApi) });
}

export async function createService(req, res) {
  const { name, price, duration } = req.body;

  if (!name || price === undefined || !duration) {
    throw new HttpError(400, "Name, price and duration are required.");
  }

  const service = await Service.create({ name, price, duration });
  res.status(201).json({ success: true, data: serviceToApi(service) });
}

export async function updateService(req, res) {
  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.price !== undefined) updateData.price = req.body.price;
  if (req.body.duration !== undefined) updateData.duration = req.body.duration;
  if (req.body.active !== undefined) updateData.active = req.body.active;

  const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  if (!service) {
    throw new HttpError(404, "Service not found.");
  }

  res.json({ success: true, data: serviceToApi(service) });
}

export async function deleteService(req, res) {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!service) {
    throw new HttpError(404, "Service not found.");
  }

  res.json({ success: true, message: "Service deactivated successfully." });
}
