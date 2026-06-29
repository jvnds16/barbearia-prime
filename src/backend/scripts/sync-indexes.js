import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Appointment } from "../src/models/appointment.model.js";
import { Service } from "../src/models/service.model.js";

try {
  await connectDatabase();
  await Promise.all([
    Appointment.syncIndexes(),
    Service.syncIndexes()
  ]);
  console.log("Índices sincronizados com sucesso.");
} finally {
  await mongoose.disconnect();
}