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
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  legacyDeleteQuerySchema,
  publicScheduleQuerySchema
} from "../validation/schemas.js";

export const schedulingRoutes = Router();

// Compatibilidade temporária com clientes antigos. Novas mutações usam /appointments.
schedulingRoutes.get(
  "/",
  validateRequest(publicScheduleQuerySchema, "query"),
  asyncHandler(listPublicSchedule)
);
schedulingRoutes.post(
  "/",
  schedulingLimiter,
  validateRequest(appointmentCreateSchema),
  asyncHandler(createAppointment)
);
schedulingRoutes.put(
  "/",
  requireAuth,
  validateRequest(appointmentUpdateSchema),
  asyncHandler(updateAppointment)
);
schedulingRoutes.delete(
  "/",
  requireAuth,
  validateRequest(legacyDeleteQuerySchema, "query"),
  asyncHandler(deleteAppointment)
);
