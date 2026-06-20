export function errorHandler(error, req, res, next) {
  if (error?.code === 11000 && (error?.keyPattern?.slotKey || error?.keyPattern?.slotKeys)) {
    return res.status(409).json({
      success: false,
      error: "This time slot was just booked. Choose another one."
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "A record with this data already exists."
    });
  }

  const statusCode = error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: error.message || "Internal server error"
  });
}
