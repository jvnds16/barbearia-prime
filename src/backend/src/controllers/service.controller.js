import { HttpError } from "../utils/httpError.js";
import { serviceToApi } from "../utils/apiSerializers.js";
import { sendData, sendMessage } from "../utils/apiResponse.js";
import {
  createServiceRecord,
  deactivateServiceById,
  findActiveServices,
  updateServiceById
} from "../services/service.service.js";

export async function listServices(req, res) {
  const services = await findActiveServices();
  return sendData(res, services.map(serviceToApi));
}

export async function createService(req, res) {
  const { name, price, duration } = req.body;

  if (!name || price === undefined || !duration) {
    throw new HttpError(400, "Name, price and duration are required.");
  }

  const service = await createServiceRecord({
    name,
    price,
    duration,
    active: req.body.active
  });
  return sendData(res, serviceToApi(service), 201);
}

export async function updateService(req, res) {
  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.price !== undefined) updateData.price = req.body.price;
  if (req.body.duration !== undefined) updateData.duration = req.body.duration;
  if (req.body.active !== undefined) updateData.active = req.body.active;

  const service = await updateServiceById(req.params.id, updateData);

  if (!service) {
    throw new HttpError(404, "Service not found.");
  }

  return sendData(res, serviceToApi(service));
}

export async function deleteService(req, res) {
  const service = await deactivateServiceById(req.params.id);

  if (!service) {
    throw new HttpError(404, "Service not found.");
  }

  return sendMessage(res, "Service deactivated successfully.");
}
