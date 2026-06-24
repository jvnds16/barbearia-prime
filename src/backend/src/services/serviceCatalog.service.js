import { Service } from "../models/service.model.js";

export const defaultServices = [
  { name: "Corte Clássico", price: 30, duration: "30 min" },
  { name: "Corte + Barba", price: 50, duration: "50 min" },
  { name: "Corte com Pigmentação", price: 70, duration: "60 min" },
  { name: "Barba", price: 25, duration: "25 min" },
  { name: "Sobrancelha", price: 15, duration: "10 min" },
  { name: "Pacote Premium", price: 90, duration: "80 min" }
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

export async function resolveServicePrice(serviceName) {
  const service = await Service.findOne({ name: serviceName, active: true });

  return service?.price ?? null;
}

export function parseDurationMinutes(duration) {
  // Durations are stored as display text, so derive minutes defensively.
  const minutes = Number.parseInt(String(duration || ""), 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
}

export async function resolveServiceDetails(serviceName) {
  const service = await Service.findOne({ name: serviceName, active: true }).lean();
  if (!service) return null;

  return {
    name: service.name,
    price: service.price,
    durationMinutes: parseDurationMinutes(service.duration)
  };
}
