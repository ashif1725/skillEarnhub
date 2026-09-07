"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/auth.middleware");

const walletController =
require("../controllers/wallet.controller");

const protect =
authMiddleware.protect ||
authMiddleware.requireAuth ||
authMiddleware;

if (typeof protect !== "function") {
throw new Error(
"Authentication middleware is not exported correctly."
);
}

const {
getWallet,
addFunds,
withdrawFunds,
getTransactionHistory
} = walletController;

function requireController(fn, name) {
if (typeof fn !== "function") {
throw new Error(
`Wallet controller function "${name}" is missing.`
);
}

```
return fn;
```

}

router.get(
"/",
protect,
requireController(
getWallet,
"getWallet"
)
);

router.post(
"/add",
protect,
requireController(
addFunds,
"addFunds"
)
);

router.post(
"/withdraw",
protect,
requireController(
withdrawFunds,
"withdrawFunds"
)
);

router.get(
"/transactions",
protect,
requireController(
getTransactionHistory,
"getTransactionHistory"
)
);

module.exports = router;
