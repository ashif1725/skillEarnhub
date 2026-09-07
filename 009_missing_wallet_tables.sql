BEGIN;

-- =========================================================
-- SKILLEARNHUB
-- Missing Registration Wallet Tables
-- =========================================================


-- =========================================================
-- WALLETS
-- Source:
-- backend/migrations/001_initial_schema.sql
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
-- WALLET BALANCES
-- Source:
-- backend/migrations/003_wallet_ledger.sql
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
