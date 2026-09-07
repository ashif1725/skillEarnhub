"use strict";

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = { notFound };
