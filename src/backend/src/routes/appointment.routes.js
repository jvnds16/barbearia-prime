import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  listAvailableSlots,
  listPublicAppointments,
  updateAppointment
} from "../controllers/appointment.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { appointmentLimiter } from "../middlewares/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentUpdateSchema,
  availabilityQuerySchema,
  objectIdParamsSchema,
  publicAppointmentQuerySchema
} from "../validation/schemas.js";

export const appointmentRoutes = Router();

appointmentRoutes.get(
  "/",
  requireAuth,
  validateRequest(appointmentListQuerySchema, "query"),
  asyncHandler(listAppointments)
);
appointmentRoutes.post(
  "/",
  appointmentLimiter,
  validateRequest(appointmentCreateSchema),
  asyncHandler(createAppointment)
);
appointmentRoutes.get(
  "/public",
  validateRequest(publicAppointmentQuerySchema, "query"),
  asyncHandler(listPublicAppointments)
);
appointmentRoutes.get(
  "/available-slots",
  validateRequest(availabilityQuerySchema, "query"),
  asyncHandler(listAvailableSlots)
);
appointmentRoutes.put(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  validateRequest(appointmentUpdateSchema),
  asyncHandler(updateAppointment)
);
appointmentRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  asyncHandler(deleteAppointment)
);
