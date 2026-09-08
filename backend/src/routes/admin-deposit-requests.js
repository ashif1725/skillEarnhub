"use strict";

const express = require("express");
const router = express.Router();

const authMiddleware = require(
"../middleware/auth.middleware"
);

const adminMiddleware = require(
"../middleware/admin.middleware"
);

const {
getPendingDeposits,
approveDepositRequest,
rejectDepositRequest
} = require(
"../services/deposit.service"
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
typeof getPendingDeposits !== "function" ||
typeof approveDepositRequest !== "function" ||
typeof rejectDepositRequest !== "function"
) {
throw new Error(
"Required deposit service functions are missing."
);
}

router.get(
"/",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const deposits =
await getPendingDeposits();

```
  return res.status(200).json({
    success: true,
    deposits: deposits || []
  });

} catch (error) {
  console.error(
    "ADMIN GET DEPOSITS ERROR:",
    error
  );

  return res.status(500).json({
    success: false,
    error:
      error.code ||
      "DEPOSITS_FETCH_FAILED",
    message:
      error.message ||
      "Unable to fetch deposit requests."
  });
}
```

}
);

router.post(
"/:depositId/approve",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const depositId = String(
req.params.depositId || ""
).trim();

```
  const adminUserId =
    req.user?.id;

  if (!depositId) {
    return res.status(400).json({
      success: false,
      error: "DEPOSIT_ID_REQUIRED",
      message:
        "Deposit ID is required."
    });
  }

  if (!adminUserId) {
    return res.status(401).json({
      success: false,
      error: "ADMIN_AUTH_REQUIRED",
      message:
        "Authenticated admin user was not found."
    });
  }

  const result =
    await approveDepositRequest({
      depositId,
      adminUserId
    });

  return res.status(200).json({
    success: true,
    message:
      "Deposit approved successfully.",
    result
  });

} catch (error) {
  console.error(
    "ADMIN APPROVE DEPOSIT ERROR:",
    error
  );

  return res.status(400).json({
    success: false,
    error:
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

router.post(
"/:depositId/reject",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const depositId = String(
req.params.depositId || ""
).trim();

```
  const adminUserId =
    req.user?.id;

  const reason =
    typeof req.body?.reason === "string"
      ? req.body.reason.trim() || null
      : null;

  if (!depositId) {
    return res.status(400).json({
      success: false,
      error: "DEPOSIT_ID_REQUIRED",
      message:
        "Deposit ID is required."
    });
  }

  if (!adminUserId) {
    return res.status(401).json({
      success: false,
      error: "ADMIN_AUTH_REQUIRED",
      message:
        "Authenticated admin user was not found."
    });
  }

  const result =
    await rejectDepositRequest({
      depositId,
      adminUserId,
      reason
    });

  return res.status(200).json({
    success: true,
    message:
      "Deposit rejected successfully.",
    result
  });

} catch (error) {
  console.error(
    "ADMIN REJECT DEPOSIT ERROR:",
    error
  );

  return res.status(400).json({
    success: false,
    error:
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
