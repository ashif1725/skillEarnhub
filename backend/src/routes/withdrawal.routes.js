"use strict";

const express = require("express");

const router = express.Router();

/* =========================================================
CONTROLLER
========================================================= */

const withdrawalController = require(
"../controllers/withdrawal.controller"
);

/* =========================================================
AUTH MIDDLEWARE
========================================================= */

const authMiddleware = require(
"../middleware/auth.middleware"
);

const requireAuth =
authMiddleware.requireAuth ||
authMiddleware.protect ||
authMiddleware;

if (typeof requireAuth !== "function") {
throw new Error(
"withdrawal.routes.js: requireAuth middleware is missing or invalid."
);
}

/* =========================================================
ADMIN MIDDLEWARE
========================================================= */

const adminMiddleware = require(
"../middleware/admin.middleware"
);

const requireAdmin =
adminMiddleware.requireAdmin;

if (typeof requireAdmin !== "function") {
throw new Error(
"withdrawal.routes.js: requireAdmin middleware is missing or invalid."
);
}

/* =========================================================
CONTROLLER FUNCTIONS
========================================================= */

const {
createWithdrawal,
getMyWithdrawals,
getPendingWithdrawals,
approveWithdrawal,
rejectWithdrawal
} = withdrawalController;

/* =========================================================
CONTROLLER VALIDATION
========================================================= */

if (typeof createWithdrawal !== "function") {
throw new Error(
"withdrawal.routes.js: controller.createWithdrawal is missing or invalid."
);
}

if (typeof getMyWithdrawals !== "function") {
throw new Error(
"withdrawal.routes.js: controller.getMyWithdrawals is missing or invalid."
);
}

if (typeof getPendingWithdrawals !== "function") {
throw new Error(
"withdrawal.routes.js: controller.getPendingWithdrawals is missing or invalid."
);
}

if (typeof approveWithdrawal !== "function") {
throw new Error(
"withdrawal.routes.js: controller.approveWithdrawal is missing or invalid."
);
}

if (typeof rejectWithdrawal !== "function") {
throw new Error(
"withdrawal.routes.js: controller.rejectWithdrawal is missing or invalid."
);
}

/* =========================================================
CREATE WITHDRAWAL

POST /api/withdrawals
========================================================= */

router.post(
"/",
requireAuth,
createWithdrawal
);

/* =========================================================
GET CURRENT USER WITHDRAWALS

GET /api/withdrawals/my
========================================================= */

router.get(
"/my",
requireAuth,
getMyWithdrawals
);

/* =========================================================
ADMIN GET PENDING WITHDRAWALS

GET /api/withdrawals/admin/pending
========================================================= */

router.get(
"/admin/pending",
requireAuth,
requireAdmin,
getPendingWithdrawals
);

/* =========================================================
ADMIN APPROVE WITHDRAWAL

POST /api/withdrawals/admin/:withdrawalId/approve
========================================================= */

router.post(
"/admin/:withdrawalId/approve",
requireAuth,
requireAdmin,
approveWithdrawal
);

/* =========================================================
ADMIN REJECT WITHDRAWAL

POST /api/withdrawals/admin/:withdrawalId/reject
========================================================= */

router.post(
"/admin/:withdrawalId/reject",
requireAuth,
requireAdmin,
rejectWithdrawal
);

/* =========================================================
EXPORT
========================================================= */

module.exports = router;
