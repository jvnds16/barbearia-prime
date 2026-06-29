export function validateRequest(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.issues[0]?.message || "Invalid request.",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    // Controllers receive the parsed and trimmed data instead of raw request input.
    req[source] = result.data;
    return next();
  };
}