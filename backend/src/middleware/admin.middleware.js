"use strict";

function normalizeRole(role) {
return String(role || "user")
.trim()
.toLowerCase();
}

function requireAdmin(req, res, next) {
if (!req.user) {
return res.status(401).json({
success: false,
error: "AUTHENTICATION_REQUIRED",
message: "Please sign in."
});
}

```
const role = normalizeRole(req.user.role);

const allowedRoles = [
    "admin",
    "administrator",
    "super_admin",
    "superadmin"
];

if (!allowedRoles.includes(role)) {
    return res.status(403).json({
        success: false,
        error: "ADMIN_ACCESS_REQUIRED",
        message: "Administrator access is required."
    });
}

return next();
```

}

function requireSuperAdmin(req, res, next) {
if (!req.user) {
return res.status(401).json({
success: false,
error: "AUTHENTICATION_REQUIRED",
message: "Please sign in."
});
}

```
const role = normalizeRole(req.user.role);

const allowedRoles = [
    "super_admin",
    "superadmin"
];

if (!allowedRoles.includes(role)) {
    return res.status(403).json({
        success: false,
        error: "SUPER_ADMIN_ACCESS_REQUIRED",
        message: "Super administrator access is required."
    });
}

return next();
```

}

module.exports = {
requireAdmin,
requireSuperAdmin
};
