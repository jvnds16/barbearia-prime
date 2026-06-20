import { Router } from "express";
import {
  createService,
  deleteService,
  listServices,
  updateService
} from "../controllers/service.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const serviceRoutes = Router();

serviceRoutes.get("/", asyncHandler(listServices));
serviceRoutes.post("/", requireAuth, asyncHandler(createService));
serviceRoutes.put("/:id", requireAuth, asyncHandler(updateService));
serviceRoutes.delete("/:id", requireAuth, asyncHandler(deleteService));
