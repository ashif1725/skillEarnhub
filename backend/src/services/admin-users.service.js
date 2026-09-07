"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| NORMALIZE LIMIT
|--------------------------------------------------------------------------
*/

function normalizeLimit(
    value,
    fallback = 50,
    maximum = 100
) {

    const numericValue =
        Number(
            value
        );


    if (

        !Number.isInteger(
            numericValue
        )

        ||

        numericValue <= 0

    ) {

        return fallback;

    }


    return Math.min(
        numericValue,
        maximum
    );

}


/*
|--------------------------------------------------------------------------
| NORMALIZE OFFSET
|--------------------------------------------------------------------------
*/

function normalizeOffset(
    value
) {

    const numericValue =
        Number(
            value
        );


    if (

        !Number.isInteger(
            numericValue
        )

        ||

        numericValue < 0

    ) {

        return 0;

    }


    return numericValue;

}


/*
|--------------------------------------------------------------------------
| NORMALIZE SEARCH
|--------------------------------------------------------------------------
*/

function normalizeSearch(
    value
) {

    const search =
        String(
            value ||
            ""
        )
        .trim();


    if (
        !search
    ) {

        return null;

    }


    return (
        "%" +
        search +
        "%"
    );

}


/*
|--------------------------------------------------------------------------
| GET ADMIN USERS
|--------------------------------------------------------------------------
*/

async function getUsers({

    search = "",

    limit = 50,

    offset = 0

} = {}) {


    const safeLimit =
        normalizeLimit(
            limit
        );


    const safeOffset =
        normalizeOffset(
            offset
        );


    const searchPattern =
        normalizeSearch(
            search
        );


    const result =
        await pool.query(

            `
            SELECT

                /*
                ------------------------------------------------
                USER DETAILS
                ------------------------------------------------
                */

                u.id
                    AS user_id,

                u.public_user_id,

                u.full_name,

                u.email,

                COALESCE(
                    u.phone,
                    ''
                )
                    AS phone,

                COALESCE(
                    u.role,
                    'user'
                )
                    AS role,

                COALESCE(
                    u.account_status,
                    'active'
                )
                    AS account_status,

                COALESCE(
                    u.email_verified,
                    false
                )
                    AS email_verified,

                u.created_at
                    AS user_created_at,

                u.updated_at
                    AS user_updated_at,


                /*
                ------------------------------------------------
                WALLET DETAILS
                ------------------------------------------------
                */

                w.id
                    AS wallet_id,

                COALESCE(
                    w.currency,
                    'INR'
                )
                    AS wallet_currency,

                COALESCE(
                    w.status,
                    'missing'
                )
                    AS wallet_status,

                w.created_at
                    AS wallet_created_at,

                w.updated_at
                    AS wallet_updated_at,


                /*
                ------------------------------------------------
                WALLET BALANCES
                ------------------------------------------------
                */

                COALESCE(
                    wb.available_balance,
                    0
                )
                    AS available_balance,

                COALESCE(
                    wb.pending_balance,
                    0
                )
                    AS pending_balance,


                (
                    COALESCE(
                        wb.available_balance,
                        0
                    )

                    +

                    COALESCE(
                        wb.pending_balance,
                        0
                    )
                )
                    AS total_balance


            FROM users u


            LEFT JOIN wallets w

                ON
                    w.user_id =
                    u.id


            LEFT JOIN wallet_balances wb

                ON
                    wb.wallet_id =
                    w.id


            WHERE

                (

                    $1::text IS NULL

                    OR

                    u.public_user_id
                        ILIKE $1

                    OR

                    u.full_name
                        ILIKE $1

                    OR

                    u.email
                        ILIKE $1

                    OR

                    COALESCE(
                        u.phone,
                        ''
                    )
                    ILIKE $1

                )


            ORDER BY

                u.created_at DESC,

                u.id DESC


            LIMIT
                $2


            OFFSET
                $3
            `,

            [

                searchPattern,

                safeLimit,

                safeOffset

            ]

        );


    return result.rows;

}


/*
|--------------------------------------------------------------------------
| GET USERS COUNT
|--------------------------------------------------------------------------
*/

async function getUsersCount({

    search = ""

} = {}) {


    const searchPattern =
        normalizeSearch(
            search
        );


    const result =
        await pool.query(

            `
            SELECT

                COUNT(*)::INTEGER
                    AS total


            FROM users u


            WHERE

                (

                    $1::text IS NULL

                    OR

                    u.public_user_id
                        ILIKE $1

                    OR

                    u.full_name
                        ILIKE $1

                    OR

                    u.email
                        ILIKE $1

                    OR

                    COALESCE(
                        u.phone,
                        ''
                    )
                    ILIKE $1

                )
            `,

            [
                searchPattern
            ]

        );


    return (
        result.rows[0]?.total ||
        0
    );

}


/*
|--------------------------------------------------------------------------
| GET SINGLE USER DETAILS
|--------------------------------------------------------------------------
*/

async function getUserDetails(
    userId
) {


    const result =
        await pool.query(

            `
            SELECT

                u.id
                    AS user_id,

                u.public_user_id,

                u.full_name,

                u.email,

                COALESCE(
                    u.phone,
                    ''
                )
                    AS phone,

                COALESCE(
                    u.role,
                    'user'
                )
                    AS role,

                COALESCE(
                    u.account_status,
                    'active'
                )
                    AS account_status,

                COALESCE(
                    u.email_verified,
                    false
                )
                    AS email_verified,

                u.created_at
                    AS user_created_at,

                u.updated_at
                    AS user_updated_at,


                w.id
                    AS wallet_id,

                COALESCE(
                    w.currency,
                    'INR'
                )
                    AS wallet_currency,

                COALESCE(
                    w.status,
                    'missing'
                )
                    AS wallet_status,

                w.created_at
                    AS wallet_created_at,

                w.updated_at
                    AS wallet_updated_at,


                COALESCE(
                    wb.available_balance,
                    0
                )
                    AS available_balance,


                COALESCE(
                    wb.pending_balance,
                    0
                )
                    AS pending_balance,


                (

                    COALESCE(
                        wb.available_balance,
                        0
                    )

                    +

                    COALESCE(
                        wb.pending_balance,
                        0
                    )

                )
                    AS total_balance


            FROM users u


            LEFT JOIN wallets w

                ON
                    w.user_id =
                    u.id


            LEFT JOIN wallet_balances wb

                ON
                    wb.wallet_id =
                    w.id


            WHERE

                u.id = $1


            LIMIT 1
            `,

            [
                userId
            ]

        );


    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "USER_NOT_FOUND"
            );


        error.code =
            "USER_NOT_FOUND";


        throw error;

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| GET USER BY PUBLIC USER ID
|--------------------------------------------------------------------------
*/

async function getUserByPublicUserId(
    publicUserId
) {


    const result =
        await pool.query(

            `
            SELECT

                u.id
                    AS user_id,

                u.public_user_id,

                u.full_name,

                u.email,

                COALESCE(
                    u.phone,
                    ''
                )
                    AS phone,

                COALESCE(
                    u.role,
                    'user'
                )
                    AS role,

                COALESCE(
                    u.account_status,
                    'active'
                )
                    AS account_status,

                COALESCE(
                    u.email_verified,
                    false
                )
                    AS email_verified,


                w.id
                    AS wallet_id,

                COALESCE(
                    w.currency,
                    'INR'
                )
                    AS wallet_currency,

                COALESCE(
                    w.status,
                    'missing'
                )
                    AS wallet_status,


                COALESCE(
                    wb.available_balance,
                    0
                )
                    AS available_balance,


                COALESCE(
                    wb.pending_balance,
                    0
                )
                    AS pending_balance,


                (

                    COALESCE(
                        wb.available_balance,
                        0
                    )

                    +

                    COALESCE(
                        wb.pending_balance,
                        0
                    )

                )
                    AS total_balance


            FROM users u


            LEFT JOIN wallets w

                ON
                    w.user_id =
                    u.id


            LEFT JOIN wallet_balances wb

                ON
                    wb.wallet_id =
                    w.id


            WHERE

                u.public_user_id =
                $1


            LIMIT 1
            `,

            [
                publicUserId
            ]

        );


    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "USER_NOT_FOUND"
            );


        error.code =
            "USER_NOT_FOUND";


        throw error;

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| UPDATE USER STATUS
|--------------------------------------------------------------------------
*/

async function updateUserStatus({

    userId,

    status,

    adminUserId,

    ipAddress,

    userAgent

}) {


    const normalizedStatus =
        String(
            status ||
            ""
        )
        .trim()
        .toLowerCase();


    const allowedStatuses = [

        "active",

        "suspended",

        "frozen",

        "blocked"

    ];


    if (

        !allowedStatuses.includes(
            normalizedStatus
        )

    ) {

        const error =
            new Error(
                "INVALID_ACCOUNT_STATUS"
            );


        error.code =
            "INVALID_ACCOUNT_STATUS";


        throw error;

    }


    const client =
        await pool.connect();


    try {


        await client.query(
            "BEGIN"
        );


        const currentResult =
            await client.query(

                `
                SELECT

                    id,

                    public_user_id,

                    full_name,

                    email,

                    account_status

                FROM users

                WHERE
                    id = $1

                LIMIT 1

                FOR UPDATE
                `,

                [
                    userId
                ]

            );


        if (
            currentResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "USER_NOT_FOUND"
                );


            error.code =
                "USER_NOT_FOUND";


            throw error;

        }


        const currentUser =
            currentResult.rows[0];


        if (

            String(
                currentUser.account_status ||
                ""
            )
            .toLowerCase()

            ===

            normalizedStatus

        ) {

            const error =
                new Error(
                    "STATUS_ALREADY_SET"
                );


            error.code =
                "STATUS_ALREADY_SET";


            throw error;

        }


        const updateResult =
            await client.query(

                `
                UPDATE users

                SET

                    account_status =
                        $1,

                    updated_at =
                        NOW()

                WHERE

                    id =
                        $2

                RETURNING

                    id
                        AS user_id,

                    public_user_id,

                    full_name,

                    email,

                    account_status,

                    updated_at
                `,

                [

                    normalizedStatus,

                    userId

                ]

            );


        /*
        ------------------------------------------------------
        AUDIT LOG
        ------------------------------------------------------
        */

        try {

            await client.query(

                `
                INSERT INTO audit_logs (

                    actor_user_id,

                    action,

                    entity_type,

                    entity_id,

                    before_data,

                    after_data,

                    ip_address,

                    user_agent,

                    created_at

                )

                VALUES (

                    $1,

                    $2,

                    $3,

                    $4,

                    $5::jsonb,

                    $6::jsonb,

                    $7,

                    $8,

                    NOW()

                )
                `,

                [

                    adminUserId ||
                    null,

                    "USER_STATUS_CHANGED",

                    "USER",

                    currentUser.id,

                    JSON.stringify({

                        public_user_id:
                            currentUser.public_user_id,

                        account_status:
                            currentUser.account_status

                    }),

                    JSON.stringify({

                        account_status:
                            normalizedStatus

                    }),

                    ipAddress ||
                    null,

                    userAgent ||
                    null

                ]

            );

        } catch (
            auditError
        ) {

            console.warn(

                "ADMIN USER STATUS AUDIT LOG ERROR:",

                auditError.message

            );

        }


        await client.query(
            "COMMIT"
        );


        return updateResult.rows[0];


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

                "ADMIN USER STATUS ROLLBACK ERROR:",

                rollbackError

            );

        }


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

    getUsers,

    getUsersCount,

    getUserDetails,

    getUserByPublicUserId,

    updateUserStatus

};
