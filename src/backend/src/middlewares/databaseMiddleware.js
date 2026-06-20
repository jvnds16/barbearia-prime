import { isDatabaseConnected } from "../config/database.js";
import { HttpError } from "../utils/httpError.js";

export function requireDatabase(req, res, next) {
  if (isDatabaseConnected()) {
    return next();
  }

  return next(
    new HttpError(
      503,
      "This service is temporarily unavailable. Please try again shortly."
    )
  );
}
