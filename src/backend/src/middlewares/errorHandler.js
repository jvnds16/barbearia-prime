import { env } from "../config/env.js";
import { sendError } from "../utils/apiResponse.js";

export function errorHandler(error, req, res, next) {
  // Slot-key duplicates are user-facing booking conflicts, not generic database errors.
  if (error?.code === 11000 && (error?.keyPattern?.slotKey || error?.keyPattern?.slotKeys)) {
    return sendError(res, 409, "This time slot was just booked. Choose another one.");
  }

  if (error?.code === 11000) {
    return sendError(res, 409, "A record with this data already exists.");
  }

  if (error?.name === "CastError") {
    return sendError(res, 400, "Invalid resource ID.");
  }

  if (error?.name === "ValidationError") {
    const details = Object.entries(error.errors || {}).map(([field, value]) => ({
      field,
      message: value.message
    }));
    return sendError(res, 400, "Invalid data.", details);
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return sendError(res, 400, "Invalid JSON body.");
  }

  if (error?.message === "Origin not allowed by CORS.") {
    return sendError(res, 403, "Origin is not allowed.");
  }

  const statusCode = error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  if (statusCode >= 500) {
    console.error(error);
  }

  // Hide internal failures in production while preserving useful messages in development.
  const message =
    statusCode >= 500 && env.nodeEnv === "production"
      ? "Internal server error"
      : error.message || "Internal server error";

  return sendError(res, statusCode, message, error.details);
}
