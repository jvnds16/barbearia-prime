import { Service } from "../models/service.model.js";

export const defaultServices = [
  { name: "Corte Clássico", price: 30, duration: 30 },
  { name: "Corte + Barba", price: 50, duration: 50 },
  { name: "Corte com Pigmentação", price: 70, duration: 60 },
  { name: "Barba", price: 25, duration: 25 },
  { name: "Sobrancelha", price: 15, duration: 10 },
  { name: "Pacote Premium", price: 90, duration: 80 }
];

export async function seedDefaultServices() {
  // Seed only missing services so admin edits are not overwritten on startup.
  await Service.bulkWrite(
    defaultServices.map((service) => ({
      updateOne: {
        filter: { name: service.name },
        update: { $setOnInsert: service },
        upsert: true
      }
    })),
    { ordered: false }
  );
}

export async function resolveServiceDetails(serviceName) {
  const service = await Service.findOne({ name: serviceName, active: true }).lean();
  return service ? { name: service.name, price: service.price, durationMinutes: service.duration } : null;
}