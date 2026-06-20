import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise;

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI não configurada. Crie backend/.env a partir de backend/.env.example.");
  }

  mongoose.set("strictQuery", true);

  if (isDatabaseConnected()) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri, {
      dbName: env.mongoDb,
      serverSelectionTimeoutMS: 10000
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
  return mongoose.connection;
}
