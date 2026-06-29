import { Router } from "express";
import {
  createService,
  deleteService,
  listServices,
  updateService
} from "../controllers/service.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { wrap } from "../utils/asyncHandler.js";
import {
  objectIdParamsSchema,
  serviceBodySchema,
  serviceUpdateSchema
} from "../validation/schemas.js";

export const serviceRoutes = Router();

serviceRoutes.get("/", wrap(listServices));
serviceRoutes.post("/", requireAuth, validateRequest(serviceBodySchema), wrap(createService));
serviceRoutes.put(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  validateRequest(serviceUpdateSchema),
  wrap(updateService)
);
serviceRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  wrap(deleteService)
);