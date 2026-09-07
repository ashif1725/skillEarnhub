const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const walletController = require('../controllers/wallet.controller');

const protect =
  authMiddleware.protect ||
  authMiddleware.auth ||
  authMiddleware;

if (typeof protect !== 'function') {
  throw new Error(
    'Authentication middleware is not exported correctly from auth.middleware.js'
  );
}

const {
  getWallet,
  addFunds,
  withdrawFunds,
  getTransactionHistory
} = walletController;

const requiredController = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(
      `Wallet controller function "${name}" is missing or not exported correctly`
    );
  }

  return fn;
};

router.get(
  '/',
  protect,
  requiredController(getWallet, 'getWallet')
);

router.post(
  '/add',
  protect,
  requiredController(addFunds, 'addFunds')
);

router.post(
  '/withdraw',
  protect,
  requiredController(withdrawFunds, 'withdrawFunds')
);

router.get(
  '/transactions',
  protect,
  requiredController(
    getTransactionHistory,
    'getTransactionHistory'
  )
);

module.exports = router;
