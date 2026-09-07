"use strict";


/* =========================================================
   SERVICES
========================================================= */

const withdrawalService =
    require(
        "../services/withdrawal.service"
    );


/* =========================================================
   GET AUTHENTICATED USER ID
========================================================= */

function getAuthenticatedUserId(
    req
) {

    return (

        req.user?.id ||

        req.user?.userId ||

        req.user?.user_id ||

        req.user?.sub ||

        null

    );

}


/* =========================================================
   GET AUTHENTICATED ADMIN ID
========================================================= */

function getAuthenticatedAdminId(
    req
) {

    /*
    ---------------------------------------------------------
    User must exist
    ---------------------------------------------------------
    */

    if (!req.user) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Check role

    requireAdmin middleware should normally already protect
    admin routes. This is an additional safety check.
    ---------------------------------------------------------
    */

    const role =
        String(
            req.user?.role ||
            ""
        )
        .trim()
        .toLowerCase();


    if (
![
"admin",
"administrator",
"super_admin",
"superadmin"
].includes(role)
) {
return null;
}



    /*
    ---------------------------------------------------------
    Return authenticated admin ID
    ---------------------------------------------------------
    */

    return (

        req.user?.id ||

        req.user?.userId ||

        req.user?.user_id ||

        req.user?.sub ||

        null

    );

}


/* =========================================================
   CREATE WITHDRAWAL REQUEST
========================================================= */

async function createWithdrawal(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Get authenticated user
        -----------------------------------------------------
        */

        const userId =
            getAuthenticatedUserId(
                req
            );


        if (!userId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication is required."

            });

        }


        /*
        -----------------------------------------------------
        Request body
        -----------------------------------------------------
        */

        const {

            amount,

            paymentMethod,

            paymentDetails

        } =
            req.body || {};


        /*
        -----------------------------------------------------
        Create withdrawal
        -----------------------------------------------------
        */

        const withdrawal =
            await withdrawalService
                .createWithdrawalRequest({

                    userId,

                    amount,

                    paymentMethod,

                    paymentDetails

                });


        /*
        -----------------------------------------------------
        Success response
        -----------------------------------------------------
        */

        return res.status(201).json({

            success:
                true,

            message:
                "Withdrawal request created successfully.",

            withdrawal

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   GET CURRENT USER WITHDRAWALS
========================================================= */

async function getMyWithdrawals(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Get authenticated user
        -----------------------------------------------------
        */

        const userId =
            getAuthenticatedUserId(
                req
            );


        if (!userId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication is required."

            });

        }


        /*
        -----------------------------------------------------
        Get withdrawals
        -----------------------------------------------------
        */

        const withdrawals =
            await withdrawalService
                .getUserWithdrawals({

                    userId

                });


        /*
        -----------------------------------------------------
        Success response
        -----------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            withdrawals

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ADMIN GET PENDING WITHDRAWALS
========================================================= */

async function getPendingWithdrawals(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Admin safety check

        requireAdmin middleware should normally already handle
        this before the controller is called.
        -----------------------------------------------------
        */

        const adminUserId =
            getAuthenticatedAdminId(
                req
            );


        if (!adminUserId) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "ADMIN_ACCESS_REQUIRED",

                message:
                    "Administrator access is required."

            });

        }


        /*
        -----------------------------------------------------
        Get pending withdrawals
        -----------------------------------------------------
        */

        const withdrawals =
            await withdrawalService
                .getPendingWithdrawals();


        /*
        -----------------------------------------------------
        Success response
        -----------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            withdrawals

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ADMIN APPROVE WITHDRAWAL
========================================================= */

async function approveWithdrawal(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Get authenticated admin
        -----------------------------------------------------
        */

        const adminUserId =
            getAuthenticatedAdminId(
                req
            );


        if (!adminUserId) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "ADMIN_ACCESS_REQUIRED",

                message:
                    "Administrator access is required."

            });

        }


        /*
        -----------------------------------------------------
        Get withdrawal ID
        -----------------------------------------------------
        */

        const withdrawalId =
            String(
                req.params?.withdrawalId ||
                ""
            )
            .trim();


        if (!withdrawalId) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "INVALID_WITHDRAWAL_ID",

                message:
                    "Withdrawal ID is required."

            });

        }


        /*
        -----------------------------------------------------
        Approve withdrawal
        -----------------------------------------------------
        */

        const result =
            await withdrawalService
                .approveWithdrawalRequest({

                    withdrawalId,

                    adminUserId

                });


        /*
        -----------------------------------------------------
        Success response
        -----------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            message:
                "Withdrawal approved successfully.",

            ...result

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ADMIN REJECT WITHDRAWAL
========================================================= */

async function rejectWithdrawal(
    req,
    res,
    next
) {

    try {

        /*
        -----------------------------------------------------
        Get authenticated admin
        -----------------------------------------------------
        */

        const adminUserId =
            getAuthenticatedAdminId(
                req
            );


        if (!adminUserId) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "ADMIN_ACCESS_REQUIRED",

                message:
                    "Administrator access is required."

            });

        }


        /*
        -----------------------------------------------------
        Get withdrawal ID
        -----------------------------------------------------
        */

        const withdrawalId =
            String(
                req.params?.withdrawalId ||
                ""
            )
            .trim();


        if (!withdrawalId) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "INVALID_WITHDRAWAL_ID",

                message:
                    "Withdrawal ID is required."

            });

        }


        /*
        -----------------------------------------------------
        Get rejection reason

        Reason is allowed to be optional here because the
        service may decide whether it is required.
        -----------------------------------------------------
        */

        const reason =
            req.body?.reason
                ? String(
                    req.body.reason
                ).trim()
                : null;


        /*
        -----------------------------------------------------
        Reject withdrawal
        -----------------------------------------------------
        */

        const result =
            await withdrawalService
                .rejectWithdrawalRequest({

                    withdrawalId,

                    adminUserId,

                    reason

                });


        /*
        -----------------------------------------------------
        Success response
        -----------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            message:
                "Withdrawal rejected successfully.",

            ...result

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   WITHDRAWAL ERROR HANDLER
========================================================= */

function handleWithdrawalError(
    error,
    res,
    next
) {

    console.error(
        "WITHDRAWAL CONTROLLER ERROR:",
        error
    );


    /*
    ---------------------------------------------------------
    Get error code
    ---------------------------------------------------------
    */

    const code =
        error?.code ||
        error?.message ||
        "INTERNAL_SERVER_ERROR";


    /*
    ---------------------------------------------------------
    Known errors
    ---------------------------------------------------------
    */

    const errorMap = {


        UNAUTHORIZED:
            {
                status: 401,
                message:
                    "Authentication is required."
            },


        AUTHENTICATION_REQUIRED:
            {
                status: 401,
                message:
                    "Authentication is required."
            },


        ADMIN_ACCESS_REQUIRED:
            {
                status: 403,
                message:
                    "Administrator access is required."
            },


        WALLET_NOT_FOUND:
            {
                status: 404,
                message:
                    "Wallet not found."
            },


        WALLET_BALANCE_NOT_FOUND:
            {
                status: 404,
                message:
                    "Wallet balance not found."
            },


        WITHDRAWAL_NOT_FOUND:
            {
                status: 404,
                message:
                    "Withdrawal request not found."
            },


        WITHDRAWAL_ALREADY_PROCESSED:
            {
                status: 409,
                message:
                    "This withdrawal request has already been processed."
            },


        INVALID_WITHDRAWAL_ID:
            {
                status: 400,
                message:
                    "Please provide a valid withdrawal ID."
            },


        INVALID_WITHDRAWAL_AMOUNT:
            {
                status: 400,
                message:
                    "Please enter a valid withdrawal amount."
            },


        INVALID_PAYMENT_METHOD:
            {
                status: 400,
                message:
                    "Please select a valid payment method."
            },


        INVALID_PAYMENT_DETAILS:
            {
                status: 400,
                message:
                    "Payment details are required."
            },


        INVALID_REJECTION_REASON:
            {
                status: 400,
                message:
                    "Please provide a valid rejection reason."
            },


        INSUFFICIENT_BALANCE:
            {
                status: 400,
                message:
                    "Insufficient wallet balance."
            },


        WALLET_INACTIVE:
            {
                status: 400,
                message:
                    "Wallet is not active."
            },


        WALLET_DISABLED:
            {
                status: 400,
                message:
                    "Wallet is not active."
            },


        ACCOUNT_DISABLED:
            {
                status: 403,
                message:
                    "This account is currently disabled."
            }

    };


    /*
    ---------------------------------------------------------
    Find mapped error
    ---------------------------------------------------------
    */

    const mappedError =
        errorMap[
            code
        ];


    /*
    ---------------------------------------------------------
    Return known error
    ---------------------------------------------------------
    */

    if (mappedError) {

        return res.status(
            mappedError.status
        )
        .json({

            success:
                false,

            error:
                code,

            message:
                mappedError.message

        });

    }


    /*
    ---------------------------------------------------------
    Unknown error

    Pass to global Express error handler.
    ---------------------------------------------------------
    */

    return next(
        error
    );

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createWithdrawal,

    getMyWithdrawals,

    getPendingWithdrawals,

    approveWithdrawal,

    rejectWithdrawal

};
