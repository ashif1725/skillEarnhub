"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_CURRENCY =
    "INR";


const DEFAULT_WALLET_STATUS =
    "active";


const DEFAULT_TRANSACTION_LIMIT =
    50;


const MAX_TRANSACTION_LIMIT =
    100;


/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function toSafeNumber(
    value
) {

    const numberValue =
        Number(
            value
        );


    if (
        !Number.isFinite(
            numberValue
        )
    ) {

        return 0;

    }


    return numberValue;

}


/*
|--------------------------------------------------------------------------
| NORMALIZE LIMIT
|--------------------------------------------------------------------------
*/

function normalizeLimit(
    limit
) {

    let safeLimit =
        Number(
            limit
        );


    if (

        !Number.isInteger(
            safeLimit
        )

        ||

        safeLimit <= 0

    ) {

        safeLimit =
            DEFAULT_TRANSACTION_LIMIT;

    }


    if (
        safeLimit >
        MAX_TRANSACTION_LIMIT
    ) {

        safeLimit =
            MAX_TRANSACTION_LIMIT;

    }


    return safeLimit;

}


/*
|--------------------------------------------------------------------------
| GET USER WALLET ROW
|--------------------------------------------------------------------------
*/

async function findWalletByUserId(
    client,
    userId,
    lock = false
) {

    const lockClause =
        lock

            ?

            "FOR UPDATE"

            :

            "";


    const result =
        await client.query(

            `
            SELECT

                id,

                user_id,

                currency,

                status,

                created_at

            FROM wallets

            WHERE
                user_id = $1

            ORDER BY
                created_at ASC

            LIMIT 1

            ${lockClause}
            `,

            [
                userId
            ]

        );


    if (
        result.rowCount === 0
    ) {

        return null;

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| GET WALLET BALANCE ROW
|--------------------------------------------------------------------------
*/

async function findWalletBalance(
    client,
    walletId,
    lock = false
) {

    const lockClause =
        lock

            ?

            "FOR UPDATE"

            :

            "";


    const result =
        await client.query(

            `
            SELECT

                wallet_id,

                available_balance,

                pending_balance,

                currency,

                created_at,

                updated_at

            FROM wallet_balances

            WHERE
                wallet_id = $1

            LIMIT 1

            ${lockClause}
            `,

            [
                walletId
            ]

        );


    if (
        result.rowCount === 0
    ) {

        return null;

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| CREATE WALLET BALANCE
|--------------------------------------------------------------------------
*/

async function createWalletBalance(
    client,
    walletId,
    currency
) {

    const result =
        await client.query(

            `
            INSERT INTO wallet_balances (

                wallet_id,

                available_balance,

                pending_balance,

                currency

            )

            VALUES (

                $1,

                0,

                0,

                $2

            )

            RETURNING

                wallet_id,

                available_balance,

                pending_balance,

                currency,

                created_at,

                updated_at
            `,

            [

                walletId,

                currency ||
                DEFAULT_CURRENCY

            ]

        );


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| ENSURE WALLET BALANCE
|--------------------------------------------------------------------------
|
| This function is important for old users.
|
| If wallet exists but wallet_balances row is missing,
| create the balance row automatically.
|--------------------------------------------------------------------------
*/

async function ensureWalletBalance(
    client,
    wallet,
    lock = false
) {

    let balance =
        await findWalletBalance(

            client,

            wallet.id,

            lock

        );


    if (
        balance
    ) {

        return balance;

    }


    /*
    ----------------------------------------------------------
    CREATE MISSING BALANCE ROW
    ----------------------------------------------------------
    */

    try {

        balance =
            await createWalletBalance(

                client,

                wallet.id,

                wallet.currency ||
                DEFAULT_CURRENCY

            );

    } catch (
        error
    ) {

        /*
        ------------------------------------------------------
        Another request may have created the row.
        Re-read it.
        ------------------------------------------------------
        */

        if (

            error

            &&

            error.code ===
            "23505"

        ) {

            balance =
                await findWalletBalance(

                    client,

                    wallet.id,

                    lock

                );


            if (
                balance
            ) {

                return balance;

            }

        }


        throw error;

    }


    return balance;

}


/*
|--------------------------------------------------------------------------
| ENSURE USER WALLET
|--------------------------------------------------------------------------
|
| This protects older accounts where:
|
| users row exists
|
| but wallet creation did not happen
|
| OR
|
| wallet exists but wallet_balances row is missing.
|--------------------------------------------------------------------------
*/

async function ensureUserWallet(
    client,
    userId,
    options = {}
) {

    const lock =
        Boolean(
            options.lock
        );


    let wallet =
        await findWalletByUserId(

            client,

            userId,

            lock

        );


    /*
    ----------------------------------------------------------
    WALLET EXISTS
    ----------------------------------------------------------
    */

    if (
        wallet
    ) {

        const balance =
            await ensureWalletBalance(

                client,

                wallet,

                lock

            );


        return {

            wallet,

            balance

        };

    }


    /*
    ----------------------------------------------------------
    WALLET DOES NOT EXIST
    ----------------------------------------------------------
    |
    | We first verify that the user exists.
    ----------------------------------------------------------
    */

    const userResult =
        await client.query(

            `
            SELECT

                id

            FROM users

            WHERE
                id = $1

            LIMIT 1
            `,

            [
                userId
            ]

        );


    if (
        userResult.rowCount === 0
    ) {

        const error =
            new Error(
                "User not found."
            );


        error.code =
            "USER_NOT_FOUND";


        throw error;

    }


    /*
    ----------------------------------------------------------
    CREATE WALLET
    ----------------------------------------------------------
    */

    try {

        const walletResult =
            await client.query(

                `
                INSERT INTO wallets (

                    user_id,

                    currency,

                    status

                )

                VALUES (

                    $1,

                    $2,

                    $3

                )

                RETURNING

                    id,

                    user_id,

                    currency,

                    status,

                    created_at
                `,

                [

                    userId,

                    DEFAULT_CURRENCY,

                    DEFAULT_WALLET_STATUS

                ]

            );


        wallet =
            walletResult.rows[0];


    } catch (
        error
    ) {

        /*
        ------------------------------------------------------
        Another request may have created wallet.
        ------------------------------------------------------
        */

        if (

            error

            &&

            error.code ===
            "23505"

        ) {

            wallet =
                await findWalletByUserId(

                    client,

                    userId,

                    lock

                );

        }

        else {

            throw error;

        }

    }


    if (
        !wallet
    ) {

        const error =
            new Error(
                "Unable to create or load wallet."
            );


        error.code =
            "WALLET_INITIALIZATION_FAILED";


        throw error;

    }


    const balance =
        await ensureWalletBalance(

            client,

            wallet,

            lock

        );


    return {

        wallet,

        balance

    };

}


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

async function getWallet(
    userId
) {

    if (
        !userId
    ) {

        const error =
            new Error(
                "User ID is required."
            );


        error.code =
            "INVALID_USER_ID";


        throw error;

    }


    const client =
        await pool.connect();


    try {

        /*
        ------------------------------------------------------
        START TRANSACTION
        ------------------------------------------------------
        */

        await client.query(
            "BEGIN"
        );


        /*
        ------------------------------------------------------
        ENSURE WALLET + BALANCE
        ------------------------------------------------------
        */

        const result =
            await ensureUserWallet(

                client,

                userId,

                {

                    lock:
                        false

                }

            );


        const wallet =
            result.wallet;


        const balance =
            result.balance;


        /*
        ------------------------------------------------------
        COMMIT
        ------------------------------------------------------
        */

        await client.query(
            "COMMIT"
        );


        return {

            wallet_id:
                wallet.id,

            user_id:
                wallet.user_id,

            currency:
                wallet.currency ||
                balance.currency ||
                DEFAULT_CURRENCY,

            status:
                wallet.status,

            available_balance:
                toSafeNumber(
                    balance.available_balance
                ),

            pending_balance:
                toSafeNumber(
                    balance.pending_balance
                )

        };


    } catch (
        error
    ) {

        try {

            await client.query(
                "ROLLBACK"
            );

        } catch (
            rollbackError
        ) {

            console.error(

                "GET WALLET ROLLBACK ERROR:",

                rollbackError

            );

        }


        console.error(

            "GET WALLET SERVICE ERROR:",

            error

        );


        throw error;


    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| GET TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function getTransactions(
    userId,
    limit
) {

    if (
        !userId
    ) {

        const error =
            new Error(
                "User ID is required."
            );


        error.code =
            "INVALID_USER_ID";


        throw error;

    }


    const safeLimit =
        normalizeLimit(
            limit
        );


    const result =
        await pool.query(

            `
            SELECT

                wt.id,

                wt.wallet_id,

                wt.transaction_type,

                wt.amount,

                wt.currency,

                wt.status,

                wt.reference_type,

                wt.reference_id,

                wt.description,

                wt.created_at

            FROM wallet_transactions wt

            INNER JOIN wallets w

                ON
                    w.id =
                    wt.wallet_id

            WHERE
                w.user_id = $1

            ORDER BY
                wt.created_at DESC,

                wt.id DESC

            LIMIT $2
            `,

            [

                userId,

                safeLimit

            ]

        );


    return result.rows;

}


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

async function sendMoney({

    senderUserId,

    receiverUserId,

    amount,

    description,

    idempotencyKey

}) {

    const numericAmount =
        Number(
            amount
        );


    /*
    ----------------------------------------------------------
    VALIDATE USER IDS
    ----------------------------------------------------------
    */

    if (
        !senderUserId
    ) {

        const error =
            new Error(
                "Sender user ID is required."
            );


        error.code =
            "INVALID_SENDER_USER_ID";


        throw error;

    }


    if (
        !receiverUserId
    ) {

        const error =
            new Error(
                "Receiver user ID is required."
            );


        error.code =
            "INVALID_RECEIVER_USER_ID";


        throw error;

    }


    /*
    ----------------------------------------------------------
    VALIDATE AMOUNT
    ----------------------------------------------------------
    */

    if (

        !Number.isFinite(
            numericAmount
        )

        ||

        numericAmount <= 0

    ) {

        const error =
            new Error(
                "Invalid amount."
            );


        error.code =
            "INVALID_AMOUNT";


        throw error;

    }


    /*
    ----------------------------------------------------------
    PREVENT SELF TRANSFER
    ----------------------------------------------------------
    */

    if (

        String(
            senderUserId
        )

        ===

        String(
            receiverUserId
        )

    ) {

        const error =
            new Error(
                "You cannot send money to yourself."
            );


        error.code =
            "SELF_TRANSFER";


        throw error;

    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        ------------------------------------------------------
        ENSURE BOTH WALLETS
        ------------------------------------------------------
        */

        const senderData =
            await ensureUserWallet(

                client,

                senderUserId,

                {

                    lock:
                        true

                }

            );


        const receiverData =
            await ensureUserWallet(

                client,

                receiverUserId,

                {

                    lock:
                        true

                }

            );


        const senderWallet =
            senderData.wallet;


        const receiverWallet =
            receiverData.wallet;


        /*
        ------------------------------------------------------
        CHECK WALLET STATUS
        ------------------------------------------------------
        */

        if (

            String(
                senderWallet.status
            )
            .toLowerCase()

            !==

            DEFAULT_WALLET_STATUS

        ) {

            const error =
                new Error(
                    "Sender wallet is not active."
                );


            error.code =
                "WALLET_NOT_ACTIVE";


            throw error;

        }


        if (

            String(
                receiverWallet.status
            )
            .toLowerCase()

            !==

            DEFAULT_WALLET_STATUS

        ) {

            const error =
                new Error(
                    "Receiver wallet is not active."
                );


            error.code =
                "WALLET_NOT_ACTIVE";


            throw error;

        }


        /*
        ------------------------------------------------------
        CHECK CURRENCY
        ------------------------------------------------------
        */

        if (

            String(
                senderWallet.currency
            )

            !==

            String(
                receiverWallet.currency
            )

        ) {

            const error =
                new Error(
                    "Wallet currencies do not match."
                );


            error.code =
                "CURRENCY_MISMATCH";


            throw error;

        }


        /*
        ------------------------------------------------------
        RE-READ BALANCES WITH LOCK
        ------------------------------------------------------
        */

        const senderBalance =
            await findWalletBalance(

                client,

                senderWallet.id,

                true

            );


        const receiverBalance =
            await findWalletBalance(

                client,

                receiverWallet.id,

                true

            );


        if (

            !senderBalance ||

            !receiverBalance

        ) {

            const error =
                new Error(
                    "Wallet balance not found."
                );


            error.code =
                "WALLET_BALANCE_NOT_FOUND";


            throw error;

        }


        const senderAvailable =
            toSafeNumber(
                senderBalance.available_balance
            );


        const receiverAvailable =
            toSafeNumber(
                receiverBalance.available_balance
            );


        /*
        ------------------------------------------------------
        CHECK SENDER BALANCE
        ------------------------------------------------------
        */

        if (
            senderAvailable <
            numericAmount
        ) {

            const error =
                new Error(
                    "Insufficient wallet balance."
                );


            error.code =
                "INSUFFICIENT_BALANCE";


            throw error;

        }


        /*
        ------------------------------------------------------
        CALCULATE BALANCES
        ------------------------------------------------------
        */

        const senderNewBalance =
            senderAvailable -
            numericAmount;


        const receiverNewBalance =
            receiverAvailable +
            numericAmount;


        /*
        ------------------------------------------------------
        UPDATE SENDER
        ------------------------------------------------------
        */

        await client.query(

            `
            UPDATE wallet_balances

            SET

                available_balance = $1,

                updated_at = NOW()

            WHERE
                wallet_id = $2
            `,

            [

                senderNewBalance,

                senderWallet.id

            ]

        );


        /*
        ------------------------------------------------------
        UPDATE RECEIVER
        ------------------------------------------------------
        */

        await client.query(

            `
            UPDATE wallet_balances

            SET

                available_balance = $1,

                updated_at = NOW()

            WHERE
                wallet_id = $2
            `,

            [

                receiverNewBalance,

                receiverWallet.id

            ]

        );


        /*
        ------------------------------------------------------
        CREATE SENDER TRANSACTION
        ------------------------------------------------------
        */

        const senderTransactionResult =
            await client.query(

                `
                INSERT INTO wallet_transactions (

                    wallet_id,

                    transaction_type,

                    amount,

                    currency,

                    status,

                    reference_type,

                    reference_id,

                    description

                )

                VALUES (

                    $1,

                    'transfer_out',

                    $2,

                    $3,

                    'completed',

                    'user_transfer',

                    NULL,

                    $4

                )

                RETURNING
                    *
                `,

                [

                    senderWallet.id,

                    numericAmount,

                    senderWallet.currency,

                    description ||
                    "Money sent"

                ]

            );


        /*
        ------------------------------------------------------
        CREATE RECEIVER TRANSACTION
        ------------------------------------------------------
        */

        const receiverTransactionResult =
            await client.query(

                `
                INSERT INTO wallet_transactions (

                    wallet_id,

                    transaction_type,

                    amount,

                    currency,

                    status,

                    reference_type,

                    reference_id,

                    description

                )

                VALUES (

                    $1,

                    'transfer_in',

                    $2,

                    $3,

                    'completed',

                    'user_transfer',

                    NULL,

                    $4

                )

                RETURNING
                    *
                `,

                [

                    receiverWallet.id,

                    numericAmount,

                    receiverWallet.currency,

                    description ||
                    "Money received"

                ]

            );


        /*
        ------------------------------------------------------
        COMMIT
        ------------------------------------------------------
        */

        await client.query(
            "COMMIT"
        );


        return {

            success:
                true,

            duplicate:
                false,

            senderTransaction:
                senderTransactionResult.rows[0],

            receiverTransaction:
                receiverTransactionResult.rows[0],

            senderBalance:
                senderNewBalance,

            receiverBalance:
                receiverNewBalance

        };


    } catch (
        error
    ) {

        try {

            await client.query(
                "ROLLBACK"
            );

        } catch (
            rollbackError
        ) {

            console.error(

                "SEND MONEY ROLLBACK ERROR:",

                rollbackError

            );

        }


        console.error(

            "SEND MONEY SERVICE ERROR:",

            error

        );


        throw error;


    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    getWallet,

    getTransactions,

    sendMoney,

    ensureUserWallet

};
