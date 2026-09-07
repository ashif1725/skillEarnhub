"use strict";

const express = require("express");

const router = express.Router();

/* =========================================================
CONTROLLER
========================================================= */

const controller = require(
"../controllers/admin.deposit.controller"
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

/* =========================================================
ADMIN MIDDLEWARE
========================================================= */

const adminMiddleware = require(
"../middleware/admin.middleware"
);

const requireAdmin =
adminMiddleware.requireAdmin;

/* =========================================================
STARTUP VALIDATION
========================================================= */

if (
typeof requireAuth !== "function"
) {

```
throw new Error(
    "admin-deposit.routes.js: requireAuth middleware is missing or invalid."
);
```

}

if (
typeof requireAdmin !== "function"
) {

```
throw new Error(
    "admin-deposit.routes.js: requireAdmin middleware is missing or invalid."
);
```

}

if (
!controller ||
typeof controller.getPendingDeposits !== "function"
) {

```
throw new Error(
    "admin-deposit.routes.js: controller.getPendingDeposits is missing."
);
```

}

if (
typeof controller.approveDeposit !== "function"
) {

```
throw new Error(
    "admin-deposit.routes.js: controller.approveDeposit is missing."
);
```

}

if (
typeof controller.rejectDeposit !== "function"
) {

```
throw new Error(
    "admin-deposit.routes.js: controller.rejectDeposit is missing."
);
```

}

/* =========================================================
GET PENDING DEPOSITS

GET /deposits/pending
========================================================= */

router.get(

```
"/deposits/pending",

requireAuth,

requireAdmin,

controller.getPendingDeposits
```

);

/* =========================================================
APPROVE DEPOSIT

POST /deposits/:depositId/approve
========================================================= */

router.post(

```
"/deposits/:depositId/approve",

requireAuth,

requireAdmin,

controller.approveDeposit
```

);

/* =========================================================
REJECT DEPOSIT

POST /deposits/:depositId/reject
========================================================= */

router.post(

```
"/deposits/:depositId/reject",

requireAuth,

requireAdmin,

controller.rejectDeposit
```

);

/* =========================================================
EXPORT
========================================================= */

module.exports = router;
