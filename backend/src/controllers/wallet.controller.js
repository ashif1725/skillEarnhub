"use strict";


/*
|--------------------------------------------------------------------------
| WALLET SERVICE
|--------------------------------------------------------------------------
*/

const {

    getWallet,

    getTransactions,

    sendMoney

} =
    require(
        "../services/wallet.service"
    );


/*
|--------------------------------------------------------------------------
| GET AUTHENTICATED USER ID
|--------------------------------------------------------------------------
|
| Auth middleware supports multiple compatible field names.
| Wallet operations must always use the internal database user UUID.
|
*/

function getAuthenticatedUserId(
    req
) {

    return (

        req.user?.id ||

        req.user?.userId ||

        req.user?.user_id ||

        req.session?.user_id ||

        null

    );

}


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

async function wallet(
    req,
    res
) {

    try {


        /*
        ------------------------------------------------------
        AUTHENTICATED USER ID
        ------------------------------------------------------
        */

        const userId =
            getAuthenticatedUserId(
                req
            );


        if (
            !userId
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authenticated user was not found."

            });

        }


        /*
        ------------------------------------------------------
        LOAD WALLET
        ------------------------------------------------------
        */

        const walletData =
            await getWallet(
                userId
            );


        if (
            !walletData
        ) {

            return res.status(404).json({

                success:
                    false,

                error:
                    "WALLET_NOT_FOUND",

                message:
                    "Wallet not found."

            });

        }


        /*
        ------------------------------------------------------
        NORMALIZE BALANCES
        ------------------------------------------------------
        |
        | PostgreSQL NUMERIC values may be returned as strings.
        | Do not use:
        |
        | value || 0
        |
        | without checking the actual database result.
        |
        */

        const availableBalance =
            Number(
                walletData.available_balance
            );


        const pendingBalance =
            Number(
                walletData.pending_balance
            );


        /*
        ------------------------------------------------------
        RESPONSE
        ------------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            wallet: {

                ...walletData,

                available_balance:

                    Number.isFinite(
                        availableBalance
                    )

                        ?

                        availableBalance

                        :

                        0,

                pending_balance:

                    Number.isFinite(
                        pendingBalance
                    )

                        ?

                        pendingBalance

                        :

                        0

            }

        });


    } catch (
        error
    ) {


        console.error(
            "GET WALLET ERROR:",
            error
        );


        /*
        ------------------------------------------------------
        WALLET NOT FOUND
        ------------------------------------------------------
        */

        if (

            error?.code ===
            "WALLET_NOT_FOUND"

        ) {

            return res.status(404).json({

                success:
                    false,

                error:
                    "WALLET_NOT_FOUND",

                message:
                    error.message ||
                    "Wallet not found."

            });

        }


        /*
        ------------------------------------------------------
        FALLBACK
        ------------------------------------------------------
        */

        return res.status(500).json({

            success:
                false,

            error:
                "WALLET_LOAD_FAILED",

            message:
                error?.message ||
                "Unable to load wallet."

        });


    }

}


/*
|--------------------------------------------------------------------------
| GET TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function transactions(
    req,
    res
) {

    try {


        /*
        ------------------------------------------------------
        AUTHENTICATED USER
        ------------------------------------------------------
        */

        const userId =
            getAuthenticatedUserId(
                req
            );


        if (
            !userId
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authenticated user was not found."

            });

        }


        /*
        ------------------------------------------------------
        LIMIT
        ------------------------------------------------------
        */

        let limit =
            Number(
                req.query?.limit
            );


        if (

            !Number.isInteger(
                limit
            )

            ||

            limit <= 0

        ) {

            limit =
                50;

        }


        if (
            limit > 100
        ) {

            limit =
                100;

        }


        /*
        ------------------------------------------------------
        LOAD TRANSACTIONS
        ------------------------------------------------------
        */

        const rows =
            await getTransactions(

                userId,

                limit

            );


        /*
        ------------------------------------------------------
        RESPONSE
        ------------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            transactions:

                Array.isArray(
                    rows
                )

                    ?

                    rows

                    :

                    []

        });


    } catch (
        error
    ) {


        console.error(
            "GET TRANSACTIONS ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            error:
                "TRANSACTION_HISTORY_FAILED",

            message:
                error?.message ||
                "Unable to load transaction history."

        });


    }

}


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

async function send(
    req,
    res
) {

    try {


        /*
        ------------------------------------------------------
        AUTHENTICATED SENDER
        ------------------------------------------------------
        */

        const senderUserId =
            getAuthenticatedUserId(
                req
            );


        if (
            !senderUserId
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authenticated user was not found."

            });

        }


        /*
        ------------------------------------------------------
        REQUEST BODY
        ------------------------------------------------------
        */

        const {

            receiverUserId,

            amount,

            description

        } =
            req.body ||
            {};


        /*
        ------------------------------------------------------
        VALIDATE RECEIVER
        ------------------------------------------------------
        */

        if (
            !receiverUserId
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "RECEIVER_REQUIRED",

                message:
                    "Receiver is required."

            });

        }


        /*
        ------------------------------------------------------
        VALIDATE AMOUNT
        ------------------------------------------------------
        */

        if (

            amount ===
            undefined

            ||

            amount ===
            null

            ||

            amount ===
            ""

        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "AMOUNT_REQUIRED",

                message:
                    "Amount is required."

            });

        }


        /*
        ------------------------------------------------------
        IDEMPOTENCY KEY
        ------------------------------------------------------
        */

        const idempotencyKey =
            req.get(
                "Idempotency-Key"
            )
            ||
            null;


        /*
        ------------------------------------------------------
        SEND MONEY
        ------------------------------------------------------
        */

        const result =
            await sendMoney({

                senderUserId,

                receiverUserId:

                    String(
                        receiverUserId
                    )
                    .trim(),

                amount,

                description:

                    description

                        ?

                        String(
                            description
                        )
                        .trim()

                        :

                        null,

                idempotencyKey

            });


        /*
        ------------------------------------------------------
        SUCCESS
        ------------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            message:

                result?.duplicate

                    ?

                    "Transaction already processed."

                    :

                    "Money sent successfully.",

            transaction:
                result

        });


    } catch (
        error
    ) {


        console.error(
            "SEND MONEY ERROR:",
            error
        );


        /*
        ------------------------------------------------------
        INVALID AMOUNT
        ------------------------------------------------------
        */

        if (
            error?.code ===
            "INVALID_AMOUNT"
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    "Invalid amount."

            });

        }


        /*
        ------------------------------------------------------
        SELF TRANSFER
        ------------------------------------------------------
        */

        if (
            error?.code ===
            "SELF_TRANSFER"
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    "You cannot send money to yourself."

            });

        }


        /*
        ------------------------------------------------------
        INSUFFICIENT BALANCE
        ------------------------------------------------------
        */

        if (
            error?.code ===
            "INSUFFICIENT_BALANCE"
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    "Insufficient wallet balance."

            });

        }


        /*
        ------------------------------------------------------
        WALLET NOT ACTIVE
        ------------------------------------------------------
        */

        if (
            error?.code ===
            "WALLET_NOT_ACTIVE"
        ) {

            return res.status(403).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    "Wallet is not active."

            });

        }


        /*
        ------------------------------------------------------
        RECEIVER NOT FOUND
        ------------------------------------------------------
        */

        if (
            error?.code ===
            "RECEIVER_WALLET_NOT_FOUND"
        ) {

            return res.status(404).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    "Receiver wallet not found."

            });

        }


        /*
        ------------------------------------------------------
        WALLET NOT FOUND
        ------------------------------------------------------
        */

        if (

            error?.code ===
            "WALLET_NOT_FOUND"

            ||

            error?.code ===
            "WALLET_BALANCE_NOT_FOUND"

        ) {

            return res.status(404).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    error.message ||
                    "Wallet not found."

            });

        }


        /*
        ------------------------------------------------------
        CURRENCY MISMATCH
        ------------------------------------------------------
        */

        if (
            error?.code ===
            "CURRENCY_MISMATCH"
        ) {

            return res.status(400).json({

                success:
                    false,

                error:
                    error.code,

                message:
                    "Wallet currencies do not match."

            });

        }


        /*
        ------------------------------------------------------
        FALLBACK
        ------------------------------------------------------
        */

        return res.status(500).json({

            success:
                false,

            error:

                error?.code ||
                "TRANSFER_FAILED",

            message:
                error?.message ||
                "Transfer failed."

        });


    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    wallet,

    transactions,

    send

};
