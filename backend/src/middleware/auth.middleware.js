"use strict";

const { getSession } = require("../services/session.service");

function getTokenFromRequest(req) {
  const authorization = String(req.get("authorization") || "").trim();

  if (authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const cookieToken = req.cookies?.skillearn_session || null;
  return cookieToken ? String(cookieToken).trim() || null : null;
}

function buildAuthUser(session) {
  return {
    id: String(session.user_id),
    userId: session.public_user_id || String(session.user_id),
    publicUserId: session.public_user_id || null,
    name: session.full_name || null,
    fullName: session.full_name || null,
    email: session.email || null,
    phone: session.phone || null,
    role: String(session.role || "user").trim().toLowerCase(),
    accountStatus: session.account_status || null,
    emailVerifiedAt: session.email_verified_at || null
  };
}

async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Please sign in."
      });
    }

    const session = await getSession(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "INVALID_SESSION",
        message: "Your session is invalid or has expired. Please sign in again."
      });
    }

    req.user = buildAuthUser(session);
    req.auth = {
      sessionId: session.session_id,
      userId: session.user_id,
      expiresAt: session.expires_at
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    const session = await getSession(token);
    if (session) {
      req.user = buildAuthUser(session);
      req.auth = {
        sessionId: session.session_id,
        userId: session.user_id,
        expiresAt: session.expires_at
      };
    }

    return next();
  } catch (error) {
    return next();
  }
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.protect = requireAuth;
module.exports.auth = requireAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.getTokenFromRequest = getTokenFromRequest;
