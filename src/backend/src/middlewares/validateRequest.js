import { HttpError } from "../utils/httpError.js";

export function validateRequest(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const error = new HttpError(400, result.error.issues[0]?.message || "Invalid request.");
      error.details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }));
      return next(error);
    }

    // Controllers receive the parsed and trimmed data instead of raw request input.
    req[source] = result.data;
    return next();
  };
}
