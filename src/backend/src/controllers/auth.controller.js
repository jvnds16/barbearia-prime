import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function login(req, res) {
  const { password } = req.body;

  if (!env.adminPassword || !env.jwtSecret) {
    return res.status(503).json({ success: false, error: "Administrative access is temporarily unavailable." });
  }

  if (!password) {
    return res.status(400).json({ success: false, error: "Password is required." });
  }

  if (password !== env.adminPassword) {
    return res.status(401).json({ success: false, error: "Incorrect password." });
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