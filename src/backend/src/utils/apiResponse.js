export function sendData(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendMessage(res, message, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...(data !== undefined ? { data } : {}),
    message
  });
}

export function sendError(res, statusCode, error, details) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details ? { details } : {})
  });
}
