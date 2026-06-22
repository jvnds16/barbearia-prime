import { Router } from "express";
import {
  createBarber,
  deleteBarber,
  listBarbers,
  updateBarber
} from "../controllers/barber.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  barberBodySchema,
  barberUpdateSchema,
  objectIdParamsSchema
} from "../validation/schemas.js";

export const barberRoutes = Router();

barberRoutes.get("/", asyncHandler(listBarbers));
barberRoutes.post("/", requireAuth, validateRequest(barberBodySchema), asyncHandler(createBarber));
barberRoutes.put(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  validateRequest(barberUpdateSchema),
  asyncHandler(updateBarber)
);
barberRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  asyncHandler(deleteBarber)
);
