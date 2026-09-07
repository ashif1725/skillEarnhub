"use strict";


/*
|--------------------------------------------------------------------------
| SESSION SERVICE
|--------------------------------------------------------------------------
*/

const {

    getSession

} =
    require(
        "../services/session.service"
    );


/*
|--------------------------------------------------------------------------
| NORMALIZE TOKEN
|--------------------------------------------------------------------------
*/

function normalizeToken(
    value
) {

    if (
        value ===
        undefined

        ||

        value ===
        null
    ) {

        return null;

    }


    const token =
        String(
            value
        )
        .trim();


    return token ||
        null;

}


/*
|--------------------------------------------------------------------------
| GET AUTH TOKEN
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. Authorization: Bearer TOKEN
| 2. skillearn_session cookie
| 3. access_token cookie
| 4. token cookie
|
*/

function getAuthToken(
    req
) {

    const authorization =
        normalizeToken(

            req.get(
                "authorization"
            )

        );


    if (
        authorization
    ) {

        const match =
            authorization.match(
                /^Bearer\s+(.+)$/i
            );


        if (
            match &&
            match[1]
        ) {

            const bearerToken =
                normalizeToken(
                    match[1]
                );


            if (
                bearerToken
            ) {

                return bearerToken;

            }

        }

    }


    const cookieSession =
        normalizeToken(
            req.cookies?.skillearn_session
        );


    if (
        cookieSession
    ) {

        return cookieSession;

    }


    const accessToken =
        normalizeToken(
            req.cookies?.access_token
        );


    if (
        accessToken
    ) {

        return accessToken;

    }


    const token =
        normalizeToken(
            req.cookies?.token
        );


    if (
        token
    ) {

        return token;

    }


    return null;

}


/*
|--------------------------------------------------------------------------
| CREATE AUTHENTICATED USER
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Internal user ID must remain:
|
| session.user_id
|
| This is the UUID used by:
|
| users.id
| wallets.user_id
|
| Public user ID must NEVER replace the internal UUID
| for database wallet queries.
|
*/

function createAuthenticatedUser(
    session
) {

    if (
        !session
    ) {

        return null;

    }


    const userId =
        session.user_id ||
        null;


    if (
        !userId
    ) {

        return null;

    }


    return {

        /*
        ------------------------------------------------------
        INTERNAL DATABASE USER ID
        ------------------------------------------------------
        */

        id:
            userId,

        userId:
            userId,

        user_id:
            userId,


        /*
        ------------------------------------------------------
        PUBLIC USER ID
        ------------------------------------------------------
        */

        publicUserId:

            session.public_user_id ||
            null,

        public_user_id:

            session.public_user_id ||
            null,


        /*
        ------------------------------------------------------
        USER INFORMATION
        ------------------------------------------------------
        */

        fullName:

            session.full_name ||
            null,

        full_name:

            session.full_name ||
            null,

        name:

            session.full_name ||
            null,


        email:

            session.email ||
            null,


        phone:

            session.phone ||
            null,


        /*
        ------------------------------------------------------
        ROLE
        ------------------------------------------------------
        */

        role:

            String(

                session.role ||
                "user"

            )
            .trim()
            .toLowerCase(),


        /*
        ------------------------------------------------------
        ACCOUNT STATUS
        ------------------------------------------------------
        */

        accountStatus:

            session.account_status ||
            null,

        account_status:

            session.account_status ||
            null,


        /*
        ------------------------------------------------------
        EMAIL VERIFICATION
        ------------------------------------------------------
        */

        emailVerifiedAt:

            session.email_verified_at ||
            null,

        email_verified_at:

            session.email_verified_at ||
            null

    };

}


/*
|--------------------------------------------------------------------------
| ATTACH AUTHENTICATED SESSION
|--------------------------------------------------------------------------
*/

function attachAuthenticatedSession(
    req,
    session
) {

    const user =
        createAuthenticatedUser(
            session
        );


    if (
        !user
    ) {

        return false;

    }


    req.user =
        user;


    req.session =
        session;


    req.auth = {

        sessionId:

            session.session_id ||
            null,

        expiresAt:

            session.expires_at ||
            null

    };


    return true;

}


/*
|--------------------------------------------------------------------------
| REQUIRE AUTH
|--------------------------------------------------------------------------
*/

async function requireAuth(
    req,
    res,
    next
) {

    try {


        /*
        ------------------------------------------------------
        GET TOKEN
        ------------------------------------------------------
        */

        const token =
            getAuthToken(
                req
            );


        if (
            !token
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authentication required."

            });

        }


        /*
        ------------------------------------------------------
        LOAD SESSION
        ------------------------------------------------------
        */

        const session =
            await getSession(
                token
            );


        if (
            !session
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "INVALID_SESSION",

                message:
                    "Invalid or expired session."

            });

        }


        /*
        ------------------------------------------------------
        ATTACH USER
        ------------------------------------------------------
        */

        const attached =
            attachAuthenticatedSession(

                req,

                session

            );


        if (
            !attached
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "INVALID_SESSION",

                message:
                    "Authenticated user information is invalid."

            });

        }


        /*
        ------------------------------------------------------
        CONTINUE
        ------------------------------------------------------
        */

        return next();


    } catch (
        error
    ) {


        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        return res.status(401).json({

            success:
                false,

            error:
                "AUTHENTICATION_FAILED",

            message:
                "Authentication failed."

        });


    }

}


/*
|--------------------------------------------------------------------------
| REQUIRE ADMIN
|--------------------------------------------------------------------------
*/

function requireAdmin(
    req,
    res,
    next
) {

    if (
        !req.user
    ) {

        return res.status(401).json({

            success:
                false,

            error:
                "AUTHENTICATION_REQUIRED",

            message:
                "Authentication required."

        });

    }


    const role =
        String(

            req.user.role ||
            "user"

        )
        .trim()
        .toLowerCase();


    if (

        role !==
        "admin"

        &&

        role !==
        "administrator"

    ) {

        return res.status(403).json({

            success:
                false,

            error:
                "ADMIN_ACCESS_REQUIRED",

            message:
                "Admin access required."

        });

    }


    return next();

}


/*
|--------------------------------------------------------------------------
| OPTIONAL AUTH
|--------------------------------------------------------------------------
*/

async function optionalAuth(
    req,
    res,
    next
) {

    try {


        const token =
            getAuthToken(
                req
            );


        if (
            !token
        ) {

            return next();

        }


        const session =
            await getSession(
                token
            );


        if (
            !session
        ) {

            return next();

        }


        attachAuthenticatedSession(

            req,

            session

        );


        return next();


    } catch (
        error
    ) {

        return next();

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    getAuthToken,

    createAuthenticatedUser,

    requireAuth,

    requireAdmin,

    optionalAuth

};
