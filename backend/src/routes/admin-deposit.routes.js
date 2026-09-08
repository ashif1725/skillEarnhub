"use strict";

const express = require("express");
const router = express.Router();

const depositService = require(
"../services/deposit.service"
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
!depositService ||
typeof depositService.getPendingDeposits !== "function" ||
typeof depositService.approveDepositRequest !== "function" ||
typeof depositService.rejectDepositRequest !== "function"
) {
throw new Error(
"Required deposit service functions are missing."
);
}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET PENDING DEPOSITS                                                       |
| -------------------------------------------------------------------------- |
| */                                                                         |

router.get(
"/pending",
requireAuth,
requireAdmin,
async (req, res) => {
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

| /*                                                                         |
| -------------------------------------------------------------------------- |
| APPROVE DEPOSIT                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

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
    message:
      "Deposit approved successfully.",
    result
  });

} catch (error) {
  console.error(
    "ADMIN APPROVE DEPOSIT ERROR:",
    error
  );

  const statusCode =
    error.code === "DEPOSIT_NOT_FOUND"
      ? 404
      : error.code ===
          "DEPOSIT_ALREADY_PROCESSED"
        ? 409
        : 400;

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

| /*                                                                         |
| -------------------------------------------------------------------------- |
| REJECT DEPOSIT                                                             |
| -------------------------------------------------------------------------- |
| */                                                                         |

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
    message:
      "Deposit rejected successfully.",
    result
  });

} catch (error) {
  console.error(
    "ADMIN REJECT DEPOSIT ERROR:",
    error
  );

  const statusCode =
    error.code === "DEPOSIT_NOT_FOUND"
      ? 404
      : error.code ===
          "DEPOSIT_ALREADY_PROCESSED"
        ? 409
        : 400;

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
