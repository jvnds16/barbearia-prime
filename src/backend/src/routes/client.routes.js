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

export const clientRoutes = Router();

clientRoutes.get("/", requireAuth, asyncHandler(listClients));
clientRoutes.post("/", clientCreationLimiter, asyncHandler(createClient));
clientRoutes.put("/:id", requireAuth, asyncHandler(updateClient));
clientRoutes.delete("/:id", requireAuth, asyncHandler(deleteClient));
