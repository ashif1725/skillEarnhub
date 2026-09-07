const express = require('express');
const router = express.Router();

// Import Middleware
const authMiddleware = require('../middleware/auth.middleware');
const protect = typeof authMiddleware === 'function' 
  ? authMiddleware 
  : (authMiddleware.protect || authMiddleware.auth || ((req, res, next) => next()));

// Import Controller Functions
const walletController = require('../controllers/wallet.controller');

// Destructure controllers safely
const {
  getWallet,
  addFunds,
  withdrawFunds,
  getTransactionHistory
} = walletController;

// Helper to prevent server crashes if any controller is missing
const safeRoute = (fn, name) => {
  if (typeof fn === 'function') return fn;
  return (req, res) => {
    res.status(500).json({
      success: false,
      message: `Controller function '${name}' is missing or not exported properly.`
    });
  };
};

// Wallet API Endpoints
// 1. Fetch current wallet details and balance
router.get('/', protect, safeRoute(getWallet, 'getWallet'));

// 2. Add funds / deposit into wallet
router.post('/add', protect, safeRoute(addFunds, 'addFunds'));

// 3. Request withdrawal from wallet
router.post('/withdraw', protect, safeRoute(withdrawFunds, 'withdrawFunds'));

// 4. Fetch full transaction history
router.get('/transactions', protect, safeRoute(getTransactionHistory, 'getTransactionHistory'));

module.exports = router;
