import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  if (!env.jwtSecret) {
    return res.status(503).json({ success: false, error: "Administrative access is temporarily unavailable." });
  }

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication token was not provided." });
  }

  try {
    req.user = jwt.verify(header.replace("Bearer ", ""), env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Authentication token is invalid or expired." });
  }
}