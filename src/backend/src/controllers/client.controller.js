import { Client } from "../models/client.model.js";
import { HttpError } from "../utils/httpError.js";
import { clientToApi } from "../utils/apiSerializers.js";

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(digits);
}

export function validatePublicClient(body) {
  if (typeof body?.name !== "string" || typeof body?.phone !== "string") {
    throw new HttpError(400, "Name and phone are required.");
  }

  const name = normalizeText(body.name);
  const phone = normalizeText(body.phone);

  if (name.length < 2 || name.length > 80) {
    throw new HttpError(400, "Name must be between 2 and 80 characters.");
  }

  if (!isValidPhone(phone)) {
    throw new HttpError(400, "Invalid phone. Include the area code.");
  }

  return { name, phone };
}

export async function listClients(req, res) {
  const clients = await Client.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: clients.map(clientToApi) });
}

export async function createClient(req, res) {
  const clientData = validatePublicClient(req.body);

  const client = await Client.findOneAndUpdate(
    { phone: clientData.phone },
    { $set: clientData },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(201).json({ success: true, data: clientToApi(client) });
}

export async function updateClient(req, res) {
  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.phone !== undefined) updateData.phone = req.body.phone;
  if (req.body.email !== undefined) updateData.email = req.body.email;

  const client = await Client.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  if (!client) {
    throw new HttpError(404, "Client not found.");
  }

  res.json({ success: true, data: clientToApi(client) });
}

export async function deleteClient(req, res) {
  const client = await Client.findByIdAndDelete(req.params.id);

  if (!client) {
    throw new HttpError(404, "Client not found.");
  }

  res.json({ success: true, message: "Client deleted successfully." });
}
