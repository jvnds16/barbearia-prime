import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function requireAuth(req, res, next) {
  if (!env.jwtSecret) {
    return next(new HttpError(503, "Administrative access is temporarily unavailable."));
  }

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication token was not provided."));
  }

  try {
    req.user = jwt.verify(header.replace("Bearer ", ""), env.jwtSecret);
    return next();
  } catch {
    return next(new HttpError(401, "Authentication token is invalid or expired."));
  }
}
