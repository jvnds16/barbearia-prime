import { Router } from "express";
import { getSession, login } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { loginLimiter } from "../middlewares/rateLimiters.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { wrap } from "../utils/asyncHandler.js";
import { loginBodySchema } from "../validation/schemas.js";

export const authRoutes = Router();

authRoutes.post("/login", loginLimiter, validateRequest(loginBodySchema), wrap(login));
authRoutes.get("/me", requireAuth, wrap(getSession));