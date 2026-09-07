"use strict";

const walletService =
require("../services/wallet.service");

const depositService =
require("../services/deposit.service");

const withdrawalService =
require("../services/withdrawal.service");

function getAuthenticatedUserId(req) {
return (
req.user?.id ||
req.user?.userId ||
req.user?.user_id ||
req.user?.sub ||
null
);
}

function handleError(res, error, fallbackMessage) {
console.error(
"WALLET CONTROLLER ERROR:",
error
);

```
const status =
    error.code === "AUTH_USER_ID_MISSING"
        ? 401
        : error.code === "USER_NOT_FOUND"
            ? 404
            : error.code === "WALLET_NOT_FOUND"
                ? 404
                : 400;

return res.status(status).json({
    success: false,
    code: error.code || "WALLET_ERROR",
    message:
        error.message ||
        fallbackMessage
});
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET WALLET                                                                 |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getWallet(req, res) {
try {
const userId =
getAuthenticatedUserId(req);

```
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const wallet =
        await walletService.getWallet(userId);

    return res.status(200).json({
        success: true,
        message:
            "Wallet details fetched successfully",
        data: {
            walletId: wallet.wallet_id,
            userId: wallet.user_id,
            balance: wallet.available_balance,
            availableBalance:
                wallet.available_balance,
            pendingBalance:
                wallet.pending_balance,
            currency:
                wallet.currency || "INR",
            status:
                wallet.status
        }
    });

} catch (error) {
    return handleError(
        res,
        error,
        "Unable to fetch wallet details."
    );
}
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| ADD FUNDS                                                                  |
| -------------------------------------------------------------------------- |
|                                                                            |
| This creates a deposit request.                                            |
| Actual wallet credit must happen only after                                |
| the existing admin approval flow approves it.                              |
|                                                                            |
| */                                                                         |

async function addFunds(req, res) {
try {
const userId =
getAuthenticatedUserId(req);

```
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const amount =
        Number(req.body?.amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Please provide a valid amount greater than 0."
        });
    }

    const deposit =
        await depositService
            .createDepositRequest({
                userId,
                amount
            });

    return res.status(201).json({
        success: true,
        message:
            "Deposit request created successfully.",
        data: deposit
    });

} catch (error) {
    return handleError(
        res,
        error,
        "Unable to create deposit request."
    );
}
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| WITHDRAW FUNDS                                                             |
| -------------------------------------------------------------------------- |
|                                                                            |
| This creates a withdrawal request.                                         |
| The existing withdrawal approval flow should                               |
| process the final balance movement.                                        |
|                                                                            |
| */                                                                         |

async function withdrawFunds(req, res) {
try {
const userId =
getAuthenticatedUserId(req);

```
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const amount =
        Number(req.body?.amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Please provide a valid withdrawal amount."
        });
    }

    const withdrawal =
        await withdrawalService
            .createWithdrawalRequest({
                userId,
                amount,
                bankDetails:
                    req.body?.bankDetails || null
            });

    return res.status(201).json({
        success: true,
        message:
            "Withdrawal request created successfully.",
        data: withdrawal
    });

} catch (error) {
    return handleError(
        res,
        error,
        "Unable to create withdrawal request."
    );
}
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| TRANSACTION HISTORY                                                        |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getTransactionHistory(req, res) {
try {
const userId =
getAuthenticatedUserId(req);

```
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const transactions =
        await walletService.getTransactions(
            userId,
            req.query?.limit
        );

    return res.status(200).json({
        success: true,
        message:
            "Transaction history fetched successfully.",
        data: transactions
    });

} catch (error) {
    return handleError(
        res,
        error,
        "Unable to fetch transaction history."
    );
}
```

}

module.exports = {
getWallet,
addFunds,
withdrawFunds,
getTransactionHistory
};
