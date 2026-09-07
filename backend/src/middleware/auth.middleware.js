"use strict";

const jwt = require("jsonwebtoken");

function getTokenFromRequest(req) {
const authorization = String(
req.headers.authorization || ""
).trim();

```
if (authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();

    if (token) {
        return token;
    }
}

const cookieToken =
    req.cookies?.token ||
    req.cookies?.access_token ||
    req.cookies?.accessToken ||
    req.cookies?.skillearn_access_token ||
    null;

if (cookieToken) {
    const token = String(cookieToken).trim();

    if (token) {
        return token;
    }
}

return null;
```

}

function extractUserId(decoded) {
if (!decoded || typeof decoded !== "object") {
return null;
}

```
const userId =
    decoded.id ||
    decoded.userId ||
    decoded.user_id ||
    decoded.sub ||
    decoded.user?.id ||
    decoded.user?.userId ||
    decoded.user?.user_id ||
    null;

if (userId === null || userId === undefined) {
    return null;
}

const normalizedUserId = String(userId).trim();

return normalizedUserId || null;
```

}

function buildAuthUser(decoded, userId) {
const nestedUser =
decoded?.user &&
typeof decoded.user === "object"
? decoded.user
: {};

```
return {
    ...decoded,
    ...nestedUser,
    id: userId,
    userId: userId,
    user_id: userId
};
```

}

function requireAuth(req, res, next) {
try {
const token = getTokenFromRequest(req);

```
    if (!token) {
        return res.status(401).json({
            success: false,
            error: "UNAUTHORIZED",
            message: "Authentication token is required."
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error(
            "JWT_SECRET is missing from environment variables."
        );

        return res.status(500).json({
            success: false,
            error: "SERVER_CONFIGURATION_ERROR",
            message: "Authentication service is not configured."
        });
    }

    const decoded = jwt.verify(token, secret);

    const userId = extractUserId(decoded);

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "INVALID_TOKEN",
            message:
                "Authentication token does not contain a valid user ID."
        });
    }

    req.user = buildAuthUser(decoded, userId);

    return next();

} catch (error) {
    console.error(
        "AUTH MIDDLEWARE ERROR:",
        error.message
    );

    if (error.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            error: "TOKEN_EXPIRED",
            message:
                "Your session has expired. Please login again."
        });
    }

    return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN",
        message: "Invalid authentication token."
    });
}
```

}

function optionalAuth(req, res, next) {
const token = getTokenFromRequest(req);

```
if (!token || !process.env.JWT_SECRET) {
    return next();
}

try {
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    const userId = extractUserId(decoded);

    if (userId) {
        req.user = buildAuthUser(
            decoded,
            userId
        );
    }
} catch (error) {
    // Optional authentication intentionally does not block.
}

return next();
```

}

module.exports = requireAuth;

module.exports.protect = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.getTokenFromRequest = getTokenFromRequest;
module.exports.extractUserId = extractUserId;
