import { Router } from "express";
import {
  createService,
  deleteService,
  listServices,
  updateService
} from "../controllers/service.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  objectIdParamsSchema,
  serviceBodySchema,
  serviceUpdateSchema
} from "../validation/schemas.js";

export const serviceRoutes = Router();

serviceRoutes.get("/", asyncHandler(listServices));
serviceRoutes.post("/", requireAuth, validateRequest(serviceBodySchema), asyncHandler(createService));
serviceRoutes.put(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  validateRequest(serviceUpdateSchema),
  asyncHandler(updateService)
);
serviceRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  asyncHandler(deleteService)
);
