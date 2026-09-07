"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| RESOLVE USER ID
|--------------------------------------------------------------------------
|
| This function accepts:
|
| - users.id UUID
| - public_user_id
| - email
|
| and always resolves the real users.id UUID.
|
| This prevents wallet queries from failing when auth middleware
| provides a public user ID instead of the internal UUID.
|
*/

async function resolveUserId(
    userIdentifier
) {

    if (
        !userIdentifier
    ) {

        const error =
            new Error(
                "Authenticated user ID is missing."
            );


        error.code =
            "AUTH_USER_ID_MISSING";


        throw error;

    }


    const value =
        String(
            userIdentifier
        )
        .trim();


    const result =
        await pool.query(

            `
            SELECT

                u.id,

                u.public_user_id,

                u.email,

                u.full_name

            FROM users u

            WHERE

                CAST(
                    u.id AS TEXT
                ) = $1

                OR

                u.public_user_id = $1

                OR

                LOWER(
                    u.email
                ) = LOWER(
                    $1
                )

            LIMIT 1
            `,

            [
                value
            ]

        );


    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "Authenticated user was not found."
            );


        error.code =
            "USER_NOT_FOUND";


        throw error;

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| ENSURE WALLET BALANCE
|--------------------------------------------------------------------------
*/

async function ensureWalletBalance(
    client,
    wallet
) {

    const existingResult =
        await client.query(

            `
            SELECT

                wallet_id,

                available_balance,

                pending_balance,

                currency

            FROM wallet_balances

            WHERE wallet_id = $1

            LIMIT 1

            FOR UPDATE
            `,

            [
                wallet.id
            ]

        );


    if (
        existingResult.rowCount > 0
    ) {

        return existingResult.rows[0];

    }


    const createResult =
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

            ON CONFLICT (
                wallet_id
            )

            DO UPDATE

            SET
                wallet_id =
                    EXCLUDED.wallet_id

            RETURNING

                wallet_id,

                available_balance,

                pending_balance,

                currency
            `,

            [

                wallet.id,

                wallet.currency ||
                "INR"

            ]

        );


    return createResult.rows[0];

}


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

async function getWallet(
    userIdentifier
) {


    /*
    ----------------------------------------------------------
    Resolve the actual internal users.id first.
    ----------------------------------------------------------
    */

    const user =
        await resolveUserId(
            userIdentifier
        );


    const result =
        await pool.query(

            `
            SELECT

                w.id AS wallet_id,

                w.user_id,

                w.currency,

                w.status,

                COALESCE(
                    wb.available_balance,
                    0
                ) AS available_balance,

                COALESCE(
                    wb.pending_balance,
                    0
                ) AS pending_balance

            FROM wallets w

            LEFT JOIN wallet_balances wb

                ON wb.wallet_id =
                    w.id

            WHERE

                w.user_id = $1

            LIMIT 1
            `,

            [

                user.id

            ]

        );


    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "Wallet not found for this user."
            );


        error.code =
            "WALLET_NOT_FOUND";


        throw error;

    }


    const wallet =
        result.rows[0];


    return {

        wallet_id:
            wallet.wallet_id,

        user_id:
            wallet.user_id,

        currency:
            wallet.currency ||
            "INR",

        status:
            wallet.status,

        available_balance:
            Number(
                wallet.available_balance
            ) || 0,

        pending_balance:
            Number(
                wallet.pending_balance
            ) || 0

    };

}


/*
|--------------------------------------------------------------------------
| GET TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function getTransactions(
    userIdentifier,
    limit
) {


    /*
    ----------------------------------------------------------
    Resolve authenticated user.
    ----------------------------------------------------------
    */

    const user =
        await resolveUserId(
            userIdentifier
        );


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
            50;

    }


    if (
        safeLimit > 100
    ) {

        safeLimit =
            100;

    }


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

                ON w.id =
                    wt.wallet_id

            WHERE

                w.user_id = $1

            ORDER BY

                wt.created_at DESC

            LIMIT $2
            `,

            [

                user.id,

                safeLimit

            ]

        );


    return result.rows.map(

        function (
            transaction
        ) {

            return {

                ...transaction,

                amount:
                    Number(
                        transaction.amount
                    ) || 0

            };

        }

    );

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
    Resolve both users to internal UUID values.
    ----------------------------------------------------------
    */

    const senderUser =
        await resolveUserId(
            senderUserId
        );


    const receiverUser =
        await resolveUserId(
            receiverUserId
        );


    if (

        String(
            senderUser.id
        )

        ===

        String(
            receiverUser.id
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
        Lock both wallets.
        ------------------------------------------------------
        */

        const walletsResult =
            await client.query(

                `
                SELECT

                    id,

                    user_id,

                    currency,

                    status

                FROM wallets

                WHERE

                    user_id = ANY(
                        $1::uuid[]
                    )

                ORDER BY
                    id

                FOR UPDATE
                `,

                [

                    [

                        senderUser.id,

                        receiverUser.id

                    ]

                ]

            );


        if (
            walletsResult.rowCount !== 2
        ) {

            const error =
                new Error(
                    "Sender or receiver wallet was not found."
                );


            error.code =
                "WALLET_NOT_FOUND";


            throw error;

        }


        const senderWallet =
            walletsResult.rows.find(

                function (
                    wallet
                ) {

                    return (

                        String(
                            wallet.user_id
                        )

                        ===

                        String(
                            senderUser.id
                        )

                    );

                }

            );


        const receiverWallet =
            walletsResult.rows.find(

                function (
                    wallet
                ) {

                    return (

                        String(
                            wallet.user_id
                        )

                        ===

                        String(
                            receiverUser.id
                        )

                    );

                }

            );


        if (

            !senderWallet ||

            !receiverWallet

        ) {

            const error =
                new Error(
                    "Wallet ownership could not be verified."
                );


            error.code =
                "WALLET_OWNER_MISMATCH";


            throw error;

        }


        if (

            String(
                senderWallet.status
            )
            .toLowerCase()

            !==

            "active"

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

            "active"

        ) {

            const error =
                new Error(
                    "Receiver wallet is not active."
                );


            error.code =
                "WALLET_NOT_ACTIVE";


            throw error;

        }


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
        Ensure balance records exist.
        ------------------------------------------------------
        */

        const senderBalance =
            await ensureWalletBalance(

                client,

                senderWallet

            );


        const receiverBalance =
            await ensureWalletBalance(

                client,

                receiverWallet

            );


        const senderAvailable =
            Number(
                senderBalance.available_balance
            ) || 0;


        const receiverAvailable =
            Number(
                receiverBalance.available_balance
            ) || 0;


        if (
            senderAvailable < numericAmount
        ) {

            const error =
                new Error(
                    "Insufficient wallet balance."
                );


            error.code =
                "INSUFFICIENT_BALANCE";


            throw error;

        }


        const senderNewBalance =
            senderAvailable -
            numericAmount;


        const receiverNewBalance =
            receiverAvailable +
            numericAmount;


        await client.query(

            `
            UPDATE wallet_balances

            SET

                available_balance = $1

            WHERE

                wallet_id = $2
            `,

            [

                senderNewBalance,

                senderWallet.id

            ]

        );


        await client.query(

            `
            UPDATE wallet_balances

            SET

                available_balance = $1

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
        Create sender transaction.
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

                RETURNING *
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
        Create receiver transaction.
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

                RETURNING *
                `,

                [

                    receiverWallet.id,

                    numericAmount,

                    receiverWallet.currency,

                    description ||
                    "Money received"

                ]

            );


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

    resolveUserId

};
