"use strict";


const express =
    require(
        "express"
    );


const router =
    express.Router();


const {

    getUsers,

    getUsersCount,

    getUserDetails,

    updateUserStatus

} = require(
    "../services/admin-users.service"
);


const {
    requireAuth
} = require(
    "../middleware/auth.middleware"
);


const {
    requireAdmin
} = require(
    "../middleware/admin.middleware"
);


/*
|--------------------------------------------------------------------------
| GET ADMIN USERS
|--------------------------------------------------------------------------
|
| GET /api/admin/users
|
| Optional:
|
| ?search=
| ?limit=
| ?offset=
|
*/

router.get(

    "/",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {


        try {


            const users =
                await getUsers({

                    search:
                        req.query.search,

                    limit:
                        req.query.limit,

                    offset:
                        req.query.offset

                });


            const total =
                await getUsersCount({

                    search:
                        req.query.search

                });


            return res.json({

                success:
                    true,

                users,

                total,

                limit:
                    Number(
                        req.query.limit
                    ) ||
                    50,

                offset:
                    Number(
                        req.query.offset
                    ) ||
                    0

            });


        } catch (
            error
        ) {


            console.error(

                "ADMIN GET USERS ERROR:",

                error

            );


            return res.status(
                500
            )
            .json({

                success:
                    false,

                message:
                    "Unable to load users."

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| GET SINGLE USER
|--------------------------------------------------------------------------
|
| GET /api/admin/users/:userId
|
*/

router.get(

    "/:userId",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {


        try {


            const user =
                await getUserDetails(
                    req.params.userId
                );


            return res.json({

                success:
                    true,

                user

            });


        } catch (
            error
        ) {


            if (

                error.code ===
                "USER_NOT_FOUND"

            ) {

                return res.status(
                    404
                )
                .json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            console.error(

                "ADMIN GET USER DETAILS ERROR:",

                error

            );


            return res.status(
                500
            )
            .json({

                success:
                    false,

                message:
                    "Unable to load user details."

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| UPDATE USER STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/users/:userId/status
|
*/

router.patch(

    "/:userId/status",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {


        try {


            const user =
                await updateUserStatus({

                    userId:
                        req.params.userId,

                    status:
                        req.body?.status,

                    adminUserId:
                        req.user?.id,

                    ipAddress:
                        req.ip,

                    userAgent:
                        req.get(
                            "user-agent"
                        )

                });


            return res.json({

                success:
                    true,

                user

            });


        } catch (
            error
        ) {


            console.error(

                "ADMIN UPDATE USER STATUS ERROR:",

                error

            );


            const code =
                error.code ||
                error.message;


            const statusMap = {

                USER_NOT_FOUND:
                    404,

                INVALID_ACCOUNT_STATUS:
                    400,

                STATUS_ALREADY_SET:
                    409

            };


            const httpStatus =
                statusMap[
                    code
                ]
                ||
                500;


            return res.status(
                httpStatus
            )
            .json({

                success:
                    false,

                message:

                    httpStatus ===
                    500

                        ?

                        "Unable to update user status."

                        :

                        code

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    router;
