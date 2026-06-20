import mongoose from "mongoose";
import { Appointment } from "../models/appointment.model.js";
import { Barber } from "../models/barber.model.js";
import { Client } from "../models/client.model.js";
import { Service } from "../models/service.model.js";

const migrations = {
  appointments: {
    nome: "customerName",
    telefone: "customerPhone",
    servico: "serviceName",
    preco: "price",
    duracaoMinutos: "durationMinutes",
    data: "date",
    horario: "time",
    barbeiro: "barber",
    canceladoEm: "cancelledAt",
    canceladoPor: "cancelledBy"
  },
  barbers: {
    nome: "name",
    telefone: "phone",
    especialidades: "specialties",
    ativo: "active"
  },
  clients: {
    nome: "name",
    telefone: "phone"
  },
  services: {
    nome: "name",
    preco: "price",
    duracao: "duration",
    ativo: "active"
  }
};

const legacyIndexes = {
  appointments: ["data_1_horario_1_barbeiro_1"],
  clients: ["telefone_1"],
  services: ["nome_1"]
};

export async function migrateModelFieldsToEnglish() {
  const database = mongoose.connection.db;
  let existingCollections = new Set(
    (await database.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name)
  );
  const collectionRenames = {
    agendamentos: "appointments",
    barbeiros: "barbers",
    clientes: "clients",
    servicos: "services"
  };

  for (const [oldName, newName] of Object.entries(collectionRenames)) {
    if (!existingCollections.has(oldName)) continue;
    if (existingCollections.has(newName)) {
      throw new Error(`Migration stopped: collections "${oldName}" and "${newName}" both exist.`);
    }

    await database.collection(oldName).rename(newName);
    existingCollections.delete(oldName);
    existingCollections.add(newName);
  }

  for (const [collectionName, fields] of Object.entries(migrations)) {
    if (!existingCollections.has(collectionName)) continue;
    const collection = database.collection(collectionName);
    const indexes = new Set((await collection.indexes()).map(({ name }) => name));

    for (const indexName of legacyIndexes[collectionName] || []) {
      if (indexes.has(indexName)) {
        await collection.dropIndex(indexName);
      }
    }

    for (const [oldName, newName] of Object.entries(fields)) {
      await collection.updateMany(
        { [oldName]: { $exists: true }, [newName]: { $exists: false } },
        { $rename: { [oldName]: newName } }
      );
    }
  }

  if (existingCollections.has("appointments")) {
    await database.collection("appointments").updateMany(
      { status: { $in: ["pendente", "concluido", "cancelado"] } },
      [
        {
          $set: {
            status: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "pendente"] }, then: "pending" },
                  { case: { $eq: ["$status", "concluido"] }, then: "completed" },
                  { case: { $eq: ["$status", "cancelado"] }, then: "cancelled" }
                ],
                default: "$status"
              }
            }
          }
        }
      ]
    );
  }

  await Promise.all([
    Appointment.createIndexes(),
    Barber.createIndexes(),
    Client.createIndexes(),
    Service.createIndexes()
  ]);
}
