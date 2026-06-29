import { env } from "../config/env.js";

const ERROR_OVERRIDES = {
  11000: { status: 409, message: "A record with this data already exists." },
  CastError: { status: 400, message: "Invalid resource ID." },
  ValidationError: { status: 400, message: "Invalid data.", withDetails: true },
  "Origin not allowed by CORS.": { status: 403, message: "Origin is not allowed." }
};

function sendError(res, statusCode, error, details) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details ? { details } : {})
  });
}

export function errorHandler(error, req, res, next) {
  if (error?.code === 11000 && error?.keyPattern?.slotKeys) {
    return sendError(res, 409, "This time slot was just booked. Choose another one.");
  }

  for (const key of [String(error?.code), error?.name, error?.message]) {
    if (key && key in ERROR_OVERRIDES) {
      const { status, message, withDetails } = ERROR_OVERRIDES[key];
      const details = withDetails
        ? Object.entries(error.errors || {}).map(([field, value]) => ({
            field,
            message: value.message
          }))
        : undefined;
      return sendError(res, status, message, details);
    }
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return sendError(res, 400, "Invalid JSON body.");
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