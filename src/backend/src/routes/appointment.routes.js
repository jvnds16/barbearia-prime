import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  listAvailableSlots,
  updateAppointment
} from "../controllers/appointment.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { schedulingLimiter } from "../middlewares/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentUpdateSchema,
  availabilityQuerySchema,
  objectIdParamsSchema
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
  schedulingLimiter,
  validateRequest(appointmentCreateSchema),
  asyncHandler(createAppointment)
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
