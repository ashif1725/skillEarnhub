"use strict";

const express = require("express");

const router = express.Router();

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
"admin-deposit-requests.js: requireAuth middleware is missing or invalid."
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
"admin-deposit-requests.js: requireAdmin middleware is missing or invalid."
);
}

/* =========================================================
DEPOSIT SERVICE
========================================================= */

const depositService = require(
"../services/deposit.service"
);

const {
getPendingDeposits,
approveDepositRequest,
rejectDepositRequest
} = depositService;

if (typeof getPendingDeposits !== "function") {
throw new Error(
"admin-deposit-requests.js: getPendingDeposits is missing."
);
}

if (typeof approveDepositRequest !== "function") {
throw new Error(
"admin-deposit-requests.js: approveDepositRequest is missing."
);
}

if (typeof rejectDepositRequest !== "function") {
throw new Error(
"admin-deposit-requests.js: rejectDepositRequest is missing."
);
}

/* =========================================================
GET PENDING DEPOSIT REQUESTS

GET /api/admin/deposits
========================================================= */

router.get(
"/",
requireAuth,
requireAdmin,

```
async function (req, res) {

    try {

        const deposits =
            await getPendingDeposits();

        return res.status(200).json({
            success: true,
            deposits:
                deposits || []
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

}
```

);

/* =========================================================
APPROVE DEPOSIT

POST /api/admin/deposits/:depositId/approve
========================================================= */

router.post(
"/:depositId/approve",
requireAuth,
requireAdmin,

```
async function (req, res) {

    try {

        const depositId =
            String(
                req.params.depositId || ""
            ).trim();


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

        const statusCode =
            error.code === "DEPOSIT_NOT_FOUND"
                ? 404
                : error.code === "DEPOSIT_ALREADY_PROCESSED"
                    ? 409
                    : 500;


        return res.status(statusCode).json({
            success: false,
            error:
                error.code ||
                "DEPOSIT_APPROVAL_FAILED",
            message:
                error.message ||
                "Unable to approve deposit."
        });

    }

}
```

);

/* =========================================================
REJECT DEPOSIT

POST /api/admin/deposits/:depositId/reject
========================================================= */

router.post(
"/:depositId/reject",
requireAuth,
requireAdmin,

```
async function (req, res) {

    try {

        const depositId =
            String(
                req.params.depositId || ""
            ).trim();


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

        const statusCode =
            error.code === "DEPOSIT_NOT_FOUND"
                ? 404
                : error.code === "DEPOSIT_ALREADY_PROCESSED"
                    ? 409
                    : 500;


        return res.status(statusCode).json({
            success: false,
            error:
                error.code ||
                "DEPOSIT_REJECTION_FAILED",
            message:
                error.message ||
                "Unable to reject deposit."
        });

    }

}
```

);

/* =========================================================
EXPORT
========================================================= */

module.exports = router;
