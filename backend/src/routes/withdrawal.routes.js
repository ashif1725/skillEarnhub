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

```
throw new Error(
    "Withdrawal routes failed to load: requireAuth middleware is missing."
);
```

}

/* =========================================================
ADMIN MIDDLEWARE
========================================================= */

const adminMiddleware = require(
"../middleware/admin.middleware"
);

const requireAdmin =
adminMiddleware.requireAdmin ||
adminMiddleware.protect ||
adminMiddleware;

if (typeof requireAdmin !== "function") {

```
throw new Error(
    "Withdrawal routes failed to load: requireAdmin middleware is missing."
);
```

}

/* =========================================================
CONTROLLER FUNCTIONS
========================================================= */

const createWithdrawal =
withdrawalController.createWithdrawal;

const getMyWithdrawals =
withdrawalController.getMyWithdrawals;

const getPendingWithdrawals =
withdrawalController.getPendingWithdrawals;

const approveWithdrawal =
withdrawalController.approveWithdrawal;

const rejectWithdrawal =
withdrawalController.rejectWithdrawal;

/* =========================================================
CONTROLLER VALIDATION
========================================================= */

if (
typeof createWithdrawal !== "function"
) {

```
throw new Error(
    "Withdrawal controller export missing: createWithdrawal"
);
```

}

if (
typeof getMyWithdrawals !== "function"
) {

```
throw new Error(
    "Withdrawal controller export missing: getMyWithdrawals"
);
```

}

if (
typeof getPendingWithdrawals !== "function"
) {

```
throw new Error(
    "Withdrawal controller export missing: getPendingWithdrawals"
);
```

}

if (
typeof approveWithdrawal !== "function"
) {

```
throw new Error(
    "Withdrawal controller export missing: approveWithdrawal"
);
```

}

if (
typeof rejectWithdrawal !== "function"
) {

```
throw new Error(
    "Withdrawal controller export missing: rejectWithdrawal"
);
```

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
