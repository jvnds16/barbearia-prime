import { Router } from "express";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient
} from "../controllers/client.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clientCreationLimiter } from "../middlewares/rateLimiters.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  clientBodySchema,
  clientUpdateSchema,
  objectIdParamsSchema
} from "../validation/schemas.js";

export const clientRoutes = Router();

clientRoutes.get("/", requireAuth, asyncHandler(listClients));
clientRoutes.post(
  "/",
  requireAuth,
  clientCreationLimiter,
  validateRequest(clientBodySchema),
  asyncHandler(createClient)
);
clientRoutes.put(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  validateRequest(clientUpdateSchema),
  asyncHandler(updateClient)
);
clientRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(objectIdParamsSchema, "params"),
  asyncHandler(deleteClient)
);
