"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { notFound } = require("./src/middleware/not-found.middleware");
const { errorHandler } = require("./src/middleware/error.middleware");

const app = express();
const PORT = Number(process.env.PORT || 10000);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));

const configuredOrigins = [
  process.env.FRONTEND_ORIGIN,
  ...String(process.env.FRONTEND_ORIGINS || "").split(",")
]
  .map((value) => String(value || "").trim().replace(/\/+$/, ""))
  .filter(Boolean);

const developmentOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV === "production" ? [] : developmentOrigins)
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalized = String(origin).trim().replace(/\/+$/, "");

    if (allowedOrigins.has(normalized)) return callback(null, true);

    if (process.env.NODE_ENV !== "production") return callback(null, true);

    const error = new Error("CORS origin is not allowed");
    error.code = "CORS_NOT_ALLOWED";
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Idempotency-Key"],
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({ success: true, service: "SkillEarn Hub API", status: "running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "SkillEarn Hub API",
    status: "healthy",
    environment: process.env.NODE_ENV || "development"
  });
});

function loadRouter(path) {
  const moduleValue = require(path);
  const router = typeof moduleValue === "function"
    ? moduleValue
    : moduleValue?.router || moduleValue?.default;

  if (typeof router !== "function") {
    throw new TypeError(`Invalid Express router export: ${path}`);
  }

  return router;
}

// Single production route tree. No root-level duplicate backend files are loaded.
app.use("/api/auth", loadRouter("./src/routes/auth.routes"));
app.use("/api/wallet", loadRouter("./src/routes/wallet.routes"));
app.use("/api/deposits", loadRouter("./src/routes/deposit.routes"));
app.use("/api/withdrawals", loadRouter("./src/routes/withdrawal.routes"));
app.use("/api/admin/users", loadRouter("./src/routes/admin-users.routes"));
app.use("/api/admin/deposits", loadRouter("./src/routes/admin-deposit.routes"));

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`SkillEarn Hub API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;
