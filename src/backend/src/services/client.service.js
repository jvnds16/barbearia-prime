import { Client } from "../models/client.model.js";

export function findClients() {
  return Client.find().sort({ name: 1 }).lean();
}

export function upsertClientByPhone(clientData) {
  return Client.findOneAndUpdate(
    { phone: clientData.phone },
    { $set: clientData },
    { new: true, upsert: true, runValidators: true }
  );
}

export function updateClientById(id, updateData) {
  return Client.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
}

export function deleteClientById(id) {
  return Client.findByIdAndDelete(id);
}
