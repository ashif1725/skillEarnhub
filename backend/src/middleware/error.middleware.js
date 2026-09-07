"use strict";

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error("API ERROR:", {
    message: err?.message,
    code: err?.code,
    stack: process.env.NODE_ENV === "production" ? undefined : err?.stack
  });

  if (err?.code === "CORS_NOT_ALLOWED" || err?.message === "CORS origin is not allowed") {
    return res.status(403).json({
      success: false,
      error: "CORS_NOT_ALLOWED",
      message: "This frontend origin is not allowed to access the API."
    });
  }

  const requestedStatus = Number(err?.statusCode || err?.status || 500);
  const status = requestedStatus >= 400 && requestedStatus < 600 ? requestedStatus : 500;

  return res.status(status).json({
    success: false,
    error: err?.code || (status >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED"),
    message: status >= 500 ? "Internal server error." : (err?.message || "Request failed.")
  });
}

module.exports = { errorHandler };
