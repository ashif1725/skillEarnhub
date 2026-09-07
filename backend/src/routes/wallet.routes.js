"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const walletController = require("../controllers/wallet.controller");

/* =========================================================
AUTH MIDDLEWARE
========================================================= */

const requireAuth =
authMiddleware.requireAuth ||
authMiddleware.protect ||
authMiddleware;

if (typeof requireAuth !== "function") {
throw new Error(
"Wallet routes failed to load: authentication middleware is not exported correctly."
);
}

/* =========================================================
WALLET CONTROLLER VALIDATION
========================================================= */

if (!walletController || typeof walletController !== "object") {
throw new Error(
"Wallet routes failed to load: wallet.controller.js is not exported correctly."
);
}

const getWallet = walletController.getWallet;
const addFunds = walletController.addFunds;
const withdrawFunds = walletController.withdrawFunds;
const getTransactionHistory =
walletController.getTransactionHistory;

/* =========================================================
CONTROLLER VALIDATOR
========================================================= */

function requireController(controller, name) {

```
if (typeof controller !== "function") {

    throw new Error(
        "Wallet controller " +
        name +
        " is missing or is not a function."
    );

}

return controller;
```

}

/* =========================================================
GET WALLET

GET /api/wallet
========================================================= */

router.get(
"/",
requireAuth,
requireController(
getWallet,
"getWallet"
)
);

/* =========================================================
ADD FUNDS

POST /api/wallet/add
========================================================= */

router.post(
"/add",
requireAuth,
requireController(
addFunds,
"addFunds"
)
);

/* =========================================================
WITHDRAW FUNDS

POST /api/wallet/withdraw
========================================================= */

router.post(
"/withdraw",
requireAuth,
requireController(
withdrawFunds,
"withdrawFunds"
)
);

/* =========================================================
TRANSACTION HISTORY

GET /api/wallet/transactions
========================================================= */

router.get(
"/transactions",
requireAuth,
requireController(
getTransactionHistory,
"getTransactionHistory"
)
);

/* =========================================================
EXPORT
========================================================= */

module.exports = router;
