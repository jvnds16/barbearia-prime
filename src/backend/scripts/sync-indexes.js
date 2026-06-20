import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Appointment } from "../src/models/appointment.model.js";
import { Barber } from "../src/models/barber.model.js";
import { Client } from "../src/models/client.model.js";
import { Service } from "../src/models/service.model.js";
import { migrateModelFieldsToEnglish } from "../src/services/modelMigration.service.js";

try {
  await connectDatabase();
  await migrateModelFieldsToEnglish();
  await Promise.all([
    Appointment.syncIndexes(),
    Barber.syncIndexes(),
    Client.syncIndexes(),
    Service.syncIndexes()
  ]);
  console.log("Índices sincronizados com sucesso.");
} finally {
  await mongoose.disconnect();
}
