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
import { validateRequest } from "../middlewares/validateRequest.js";
import { wrap } from "../utils/asyncHandler.js";
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
  wrap(listAppointments)
);
appointmentRoutes.post(
  "/",
  appointmentLimiter,
  validateRequest(appointmentCreateSchema),
  wrap(createAppointment)
);
appointmentRoutes.get(
  "/public",
  validateRequest(publicAppointmentQuerySchema, "query"),
  wrap(listPublicAppointments)
);
appointmentRoutes.get(
  "/available-slots",
  validateRequest(availabilityQuerySchema, "query"),
  wrap(listAvailableSlots)
);
appointmentRoutes.put(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  validateRequest(appointmentUpdateSchema),
  wrap(updateAppointment)
);
appointmentRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  wrap(deleteAppointment)
);