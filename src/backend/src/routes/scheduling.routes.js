import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  listPublicSchedule,
  updateAppointment
} from "../controllers/appointment.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { schedulingLimiter } from "../middlewares/rateLimiters.js";

export const schedulingRoutes = Router();

// Compatibilidade temporária com clientes antigos. Novas mutações usam /appointments.
schedulingRoutes.get("/", asyncHandler(listPublicSchedule));
schedulingRoutes.post("/", schedulingLimiter, asyncHandler(createAppointment));
schedulingRoutes.put("/", requireAuth, asyncHandler(updateAppointment));
schedulingRoutes.delete("/", requireAuth, asyncHandler(deleteAppointment));
