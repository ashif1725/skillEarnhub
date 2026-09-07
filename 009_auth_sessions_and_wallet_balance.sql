"use strict";

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    session_token_hash TEXT
        UNIQUE
        NOT NULL,

    ip_address INET,

    user_agent TEXT,

    expires_at TIMESTAMPTZ
        NOT NULL,

    revoked_at TIMESTAMPTZ,

    last_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active
ON user_sessions(user_id, revoked_at, expires_at);


CREATE TABLE IF NOT EXISTS wallet_balances (
    wallet_id UUID PRIMARY KEY
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    available_balance NUMERIC(20,2)
        NOT NULL DEFAULT 0,

    pending_balance NUMERIC(20,2)
        NOT NULL DEFAULT 0,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT wallet_available_non_negative
        CHECK (available_balance >= 0),

    CONSTRAINT wallet_pending_non_negative
        CHECK (pending_balance >= 0)
);
