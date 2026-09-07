"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const walletController = require(
"../controllers/wallet.controller"
);

/* =========================================================
AUTH
========================================================= */

const requireAuth =
authMiddleware.requireAuth ||
authMiddleware.protect ||
authMiddleware;

/* =========================================================
CONTROLLERS
========================================================= */

const getWallet =
walletController.getWallet;

const addFunds =
walletController.addFunds;

const withdrawFunds =
walletController.withdrawFunds;

const getTransactionHistory =
walletController.getTransactionHistory;

/* =========================================================
ROUTES
========================================================= */

/*
GET /api/wallet
*/

router.get(
"/",
requireAuth,
getWallet
);

/*
POST /api/wallet/add
*/

router.post(
"/add",
requireAuth,
addFunds
);

/*
POST /api/wallet/withdraw
*/

router.post(
"/withdraw",
requireAuth,
withdrawFunds
);

/*
GET /api/wallet/transactions
*/

router.get(
"/transactions",
requireAuth,
getTransactionHistory
);

/* =========================================================
EXPORT
========================================================= */

module.exports =
router;
