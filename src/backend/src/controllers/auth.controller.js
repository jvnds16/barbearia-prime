import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function login(req, res) {
  const { password } = req.body;

  if (!env.adminPassword || !env.jwtSecret) {
    throw new HttpError(503, "Administrative access is temporarily unavailable.");
  }

  if (!password) {
    throw new HttpError(400, "Password is required.");
  }

  if (password !== env.adminPassword) {
    throw new HttpError(401, "Incorrect password.");
  }

  const token = jwt.sign({ role: "admin", name: "Administrator" }, env.jwtSecret, {
    expiresIn: "8h"
  });

  res.json({
    success: true,
    token,
    user: {
      name: "Administrator",
      role: "admin"
    }
  });
}

export function getSession(req, res) {
  res.json({
    success: true,
    user: {
      name: req.user.name,
      role: req.user.role
    }
  });
}
