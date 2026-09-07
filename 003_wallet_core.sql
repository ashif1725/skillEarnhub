BEGIN;

-- =========================================================
-- WALLET ACCOUNTS
-- =========================================================

CREATE TABLE IF NOT EXISTS wallet_accounts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    currency VARCHAR(10) NOT NULL DEFAULT 'POINT',

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'locked', 'closed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- WALLET LEDGER
-- =========================================================

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id BIGSERIAL PRIMARY KEY,

    wallet_id BIGINT NOT NULL
        REFERENCES wallet_accounts(id)
        ON DELETE RESTRICT,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    transaction_id UUID NOT NULL,

    entry_type VARCHAR(30) NOT NULL
        CHECK (
            entry_type IN (
                'credit',
                'debit'
            )
        ),

    amount NUMERIC(20, 2) NOT NULL
        CHECK (amount > 0),

    balance_after NUMERIC(20, 2) NOT NULL
        CHECK (balance_after >= 0),

    description VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- WALLET TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY,

    sender_wallet_id BIGINT
        REFERENCES wallet_accounts(id)
        ON DELETE RESTRICT,

    receiver_wallet_id BIGINT
        REFERENCES wallet_accounts(id)
        ON DELETE RESTRICT,

    sender_user_id BIGINT
        REFERENCES users(id)
        ON DELETE RESTRICT,

    receiver_user_id BIGINT
        REFERENCES users(id)
        ON DELETE RESTRICT,

    transaction_type VARCHAR(30) NOT NULL
        CHECK (
            transaction_type IN (
                'send',
                'receive',
                'deposit',
                'withdrawal',
                'adjustment'
            )
        ),

    amount NUMERIC(20, 2) NOT NULL
        CHECK (amount > 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'POINT',

    status VARCHAR(30) NOT NULL DEFAULT 'completed'
        CHECK (
            status IN (
                'pending',
                'completed',
                'failed',
                'cancelled'
            )
        ),

    idempotency_key VARCHAR(100),

    description VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ
);


-- =========================================================
-- UNIQUE IDEMPOTENCY KEY
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS
wallet_transactions_idempotency_key_unique
ON wallet_transactions(idempotency_key)
WHERE idempotency_key IS NOT NULL;


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS
wallet_ledger_user_idx
ON wallet_ledger(user_id, created_at DESC);


CREATE INDEX IF NOT EXISTS
wallet_ledger_wallet_idx
ON wallet_ledger(wallet_id, created_at DESC);


CREATE INDEX IF NOT EXISTS
wallet_transactions_sender_idx
ON wallet_transactions(sender_user_id, created_at DESC);


CREATE INDEX IF NOT EXISTS
wallet_transactions_receiver_idx
ON wallet_transactions(receiver_user_id, created_at DESC);


-- =========================================================
-- CREATE WALLET AUTOMATICALLY FOR EXISTING USERS
-- =========================================================

INSERT INTO wallet_accounts (
    user_id,
    currency,
    status
)
SELECT
    id,
    'POINT',
    'active'
FROM users
WHERE NOT EXISTS (
    SELECT 1
    FROM wallet_accounts w
    WHERE w.user_id = users.id
);


COMMIT;
