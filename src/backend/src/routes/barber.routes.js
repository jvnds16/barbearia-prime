import { Router } from "express";
import {
  createBarber,
  deleteBarber,
  listBarbers,
  updateBarber
} from "../controllers/barber.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const barberRoutes = Router();

barberRoutes.get("/", asyncHandler(listBarbers));
barberRoutes.post("/", requireAuth, asyncHandler(createBarber));
barberRoutes.put("/:id", requireAuth, asyncHandler(updateBarber));
barberRoutes.delete("/:id", requireAuth, asyncHandler(deleteBarber));
