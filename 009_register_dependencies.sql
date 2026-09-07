BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- USER SECURITY
-- =========================================================

CREATE TABLE IF NOT EXISTS user_security (
    user_id UUID PRIMARY KEY
        REFERENCES users(id)
        ON DELETE CASCADE,

    totp_enabled BOOLEAN
        NOT NULL DEFAULT FALSE,

    totp_secret_encrypted TEXT,

    wallet_pin_hash TEXT,

    failed_login_attempts INTEGER
        NOT NULL DEFAULT 0,

    locked_until TIMESTAMPTZ,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- =========================================================
-- WALLETS
-- =========================================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID
        UNIQUE NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    status VARCHAR(20)
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- =========================================================
-- LEDGER ACCOUNTS
-- =========================================================

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    wallet_id UUID
        UNIQUE NOT NULL
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    status VARCHAR(20)
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    actor_user_id UUID
        REFERENCES users(id),

    action VARCHAR(100)
        NOT NULL,

    entity_type VARCHAR(50),

    entity_id UUID,

    metadata JSONB,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- =========================================================
-- WALLET BALANCES
-- =========================================================

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


COMMIT;
