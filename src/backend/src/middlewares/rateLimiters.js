import { rateLimit } from "express-rate-limit";

const commonOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false
};

// Login has the strictest limit because it protects the admin area.
export const loginLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: {
    success: false,
    error: "Too many login attempts. Please try again in a few minutes."
  }
});

// Public booking allows normal retries but slows down automated spam.
export const appointmentLimiter = rateLimit({
  ...commonOptions,
  windowMs: 10 * 60 * 1000,
  limit: 12,
  message: {
    success: false,
    error: "Too many appointment attempts. Please wait a few minutes."
  }
});

// Client creation can happen from admin workflows and public booking syncs.
export const clientCreationLimiter = rateLimit({
  ...commonOptions,
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    error: "Too many requests. Please wait a few minutes."
  }
});
