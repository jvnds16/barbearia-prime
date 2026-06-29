import { Router } from "express";
import { appointmentRoutes } from "./appointment.routes.js";
import { authRoutes } from "./auth.routes.js";
import { serviceRoutes } from "./service.routes.js";
import { isDatabaseConnected } from "../config/database.js";

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
routes.use("/services", serviceRoutes);
routes.use("/appointments", appointmentRoutes);