import { Router } from "express";
import { appointmentRoutes } from "./appointment.routes.js";
import { authRoutes } from "./auth.routes.js";
import { barberRoutes } from "./barber.routes.js";
import { clientRoutes } from "./client.routes.js";
import { serviceRoutes } from "./service.routes.js";
import { isDatabaseConnected } from "../config/database.js";
import { requireDatabase } from "../middlewares/databaseMiddleware.js";

export const routes = Router();

routes.get("/health", (req, res) => {
  const connected = isDatabaseConnected();
  res.status(connected ? 200 : 503).json({
    success: true,
    status: connected ? "ok" : "degraded",
    service: "barbearia-prime-api",
    database: connected ? "connected" : "disconnected"
  });
});

routes.use("/auth", authRoutes);
routes.use("/services", requireDatabase, serviceRoutes);
routes.use("/barbers", requireDatabase, barberRoutes);
routes.use("/clients", requireDatabase, clientRoutes);
routes.use("/appointments", requireDatabase, appointmentRoutes);
