import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise;

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured. Create backend/.env from backend/.env.example.");
  }

  mongoose.set("strictQuery", true);

  if (isDatabaseConnected()) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    // Share one connection attempt across concurrent requests during startup.
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
