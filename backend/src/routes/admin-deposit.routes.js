"use strict";

const express = require("express");
const router = express.Router();

const depositService = require("../services/deposit.service");

const authMiddleware = require("../middleware/auth.middleware");

const adminMiddleware = require("../middleware/admin.middleware");

const requireAuth =
authMiddleware.requireAuth ||
authMiddleware.protect ||
authMiddleware;

const requireAdmin = adminMiddleware.requireAdmin;

if (typeof requireAuth !== "function") {
throw new Error(
"admin-deposit.routes.js: requireAuth middleware is missing or invalid."
);
}

if (typeof requireAdmin !== "function") {
throw new Error(
"admin-deposit.routes.js: requireAdmin middleware is missing or invalid."
);
}

if (!depositService) {
throw new Error(
"admin-deposit.routes.js: deposit service is missing."
);
}

if (typeof depositService.getPendingDeposits !== "function") {
throw new Error(
"admin-deposit.routes.js: getPendingDeposits is missing."
);
}

if (typeof depositService.approveDepositRequest !== "function") {
throw new Error(
"admin-deposit.routes.js: approveDepositRequest is missing."
);
}

if (typeof depositService.rejectDepositRequest !== "function") {
throw new Error(
"admin-deposit.routes.js: rejectDepositRequest is missing."
);
}

/* =========================================================
GET PENDING DEPOSITS
GET /api/admin/deposits/pending
========================================================= */

router.get(
"/pending",
requireAuth,
requireAdmin,
async function (req, res) {
try {
const deposits =
await depositService.getPendingDeposits();

```
  return res.status(200).json({
    success: true,
    deposits: deposits || []
  });
} catch (error) {
  console.error(
    "GET PENDING DEPOSITS ERROR:",
    error
  );

  return res.status(500).json({
    success: false,
    code:
      error.code ||
      "LOAD_DEPOSITS_FAILED",
    message:
      error.message ||
      "Unable to load deposits."
  });
}
```

}
);

/* =========================================================
APPROVE DEPOSIT
POST /api/admin/deposits/:depositId/approve
========================================================= */

router.post(
"/:depositId/approve",
requireAuth,
requireAdmin,
async function (req, res) {
try {
const depositId = String(
req.params.depositId || ""
).trim();

```
  const adminUserId = req.user?.id;

  if (!depositId) {
    return res.status(400).json({
      success: false,
      code: "DEPOSIT_ID_REQUIRED",
      message: "Deposit ID is required."
    });
  }

  if (!adminUserId) {
    return res.status(401).json({
      success: false,
      code: "ADMIN_AUTH_REQUIRED",
      message:
        "Authenticated admin user was not found."
    });
  }

  const result =
    await depositService.approveDepositRequest({
      depositId,
      adminUserId
    });

  return res.status(200).json({
    success: true,
    message: "Deposit approved successfully.",
    result
  });
} catch (error) {
  console.error(
    "ADMIN APPROVE DEPOSIT ERROR:",
    error
  );

  let statusCode = 400;

  if (error.code === "DEPOSIT_NOT_FOUND") {
    statusCode = 404;
  }

  if (
    error.code === "DEPOSIT_ALREADY_PROCESSED"
  ) {
    statusCode = 409;
  }

  return res.status(statusCode).json({
    success: false,
    code:
      error.code ||
      "DEPOSIT_APPROVAL_FAILED",
    message:
      error.message ||
      "Unable to approve deposit."
  });
}
```

}
);

/* =========================================================
REJECT DEPOSIT
POST /api/admin/deposits/:depositId/reject
========================================================= */

router.post(
"/:depositId/reject",
requireAuth,
requireAdmin,
async function (req, res) {
try {
const depositId = String(
req.params.depositId || ""
).trim();

```
  const adminUserId = req.user?.id;

  const reason =
    typeof req.body?.reason === "string"
      ? req.body.reason.trim() || null
      : null;

  if (!depositId) {
    return res.status(400).json({
      success: false,
      code: "DEPOSIT_ID_REQUIRED",
      message: "Deposit ID is required."
    });
  }

  if (!adminUserId) {
    return res.status(401).json({
      success: false,
      code: "ADMIN_AUTH_REQUIRED",
      message:
        "Authenticated admin user was not found."
    });
  }

  const result =
    await depositService.rejectDepositRequest({
      depositId,
      adminUserId,
      reason
    });

  return res.status(200).json({
    success: true,
    message: "Deposit rejected successfully.",
    result
  });
} catch (error) {
  console.error(
    "ADMIN REJECT DEPOSIT ERROR:",
    error
  );

  let statusCode = 400;

  if (error.code === "DEPOSIT_NOT_FOUND") {
    statusCode = 404;
  }

  if (
    error.code === "DEPOSIT_ALREADY_PROCESSED"
  ) {
    statusCode = 409;
  }

  return res.status(statusCode).json({
    success: false,
    code:
      error.code ||
      "DEPOSIT_REJECTION_FAILED",
    message:
      error.message ||
      "Unable to reject deposit."
  });
}
```

}
);

module.exports = router;
