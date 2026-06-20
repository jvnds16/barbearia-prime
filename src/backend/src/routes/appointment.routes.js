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

export const appointmentRoutes = Router();

appointmentRoutes.get("/", requireAuth, asyncHandler(listAppointments));
appointmentRoutes.post("/", schedulingLimiter, asyncHandler(createAppointment));
appointmentRoutes.put("/:id", requireAuth, asyncHandler(updateAppointment));
appointmentRoutes.delete("/:id", requireAuth, asyncHandler(deleteAppointment));
appointmentRoutes.get("/available-slots", asyncHandler(listAvailableSlots));
