"use strict";

const express = require("express");
const router = express.Router();

const controller = require(
"../controllers/admin.deposit.controller"
);

const authMiddleware = require(
"../middleware/auth.middleware"
);

const adminMiddleware = require(
"../middleware/admin.middleware"
);

const requireAuth =
authMiddleware.requireAuth ||
authMiddleware.protect ||
authMiddleware;

const requireAdmin =
adminMiddleware.requireAdmin;

if (typeof requireAuth !== "function") {
throw new Error(
"requireAuth middleware is missing or invalid."
);
}

if (typeof requireAdmin !== "function") {
throw new Error(
"requireAdmin middleware is missing or invalid."
);
}

if (
!controller ||
typeof controller.getPendingDeposits !== "function" ||
typeof controller.approveDeposit !== "function" ||
typeof controller.rejectDeposit !== "function"
) {
throw new Error(
"Required admin deposit controller functions are missing."
);
}

router.get(
"/deposits/pending",
requireAuth,
requireAdmin,
controller.getPendingDeposits
);

router.post(
"/deposits/:depositId/approve",
requireAuth,
requireAdmin,
controller.approveDeposit
);

router.post(
"/deposits/:depositId/reject",
requireAuth,
requireAdmin,
controller.rejectDeposit
);

module.exports = router;
