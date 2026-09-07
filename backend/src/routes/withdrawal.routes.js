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

const adminMiddleware = require(
"../middleware/admin.middleware"
);

const requireAuth =
authMiddleware.requireAuth ||
authMiddleware.protect ||
authMiddleware;

const requireAdmin =
adminMiddleware.requireAdmin ||
adminMiddleware;

/* =========================================================
VALIDATE MIDDLEWARE EXPORTS
========================================================= */

if (typeof requireAuth !== "function") {
throw new Error(
"Withdrawal routes failed to load: requireAuth is not a function."
);
}

if (typeof requireAdmin !== "function") {
throw new Error(
"Withdrawal routes failed to load: requireAdmin is not a function."
);
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
VALIDATE CONTROLLER FUNCTIONS
========================================================= */

const requiredControllers = {
createWithdrawal,
getMyWithdrawals,
getPendingWithdrawals,
approveWithdrawal,
rejectWithdrawal
};

for (
const name of Object.keys(
requiredControllers
)
) {

```
if (
    typeof requiredControllers[name] !==
    "function"
) {

    throw new Error(
        "Withdrawal controller export is missing or invalid: " +
        name
    );

}
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
