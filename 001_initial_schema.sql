CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    public_user_id VARCHAR(32)
        UNIQUE NOT NULL,

    full_name VARCHAR(80)
        NOT NULL,

    email VARCHAR(160)
        UNIQUE NOT NULL,

    phone VARCHAR(20)
        UNIQUE NOT NULL,

    password_hash TEXT
        NOT NULL,

    role VARCHAR(20)
        NOT NULL DEFAULT 'user',

    account_status VARCHAR(20)
        NOT NULL DEFAULT 'active',

    email_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE TABLE user_security (
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


CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

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


CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

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


CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id VARCHAR(40)
        UNIQUE NOT NULL,

    type VARCHAR(30)
        NOT NULL,

    status VARCHAR(20)
        NOT NULL,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    amount NUMERIC(20,2)
        NOT NULL,

    sender_user_id UUID
        REFERENCES users(id),

    receiver_user_id UUID
        REFERENCES users(id),

    provider_reference VARCHAR(100),

    description VARCHAR(255),

    idempotency_key VARCHAR(100)
        UNIQUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id UUID
        NOT NULL
        REFERENCES transactions(id)
        ON DELETE RESTRICT,

    ledger_account_id UUID
        NOT NULL
        REFERENCES ledger_accounts(id)
        ON DELETE RESTRICT,

    entry_type VARCHAR(10)
        NOT NULL,

    amount NUMERIC(20,2)
        NOT NULL,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

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


CREATE INDEX idx_users_public_user_id
ON users(public_user_id);


CREATE INDEX idx_transactions_sender
ON transactions(sender_user_id);


CREATE INDEX idx_transactions_receiver
ON transactions(receiver_user_id);


CREATE INDEX idx_transactions_created
ON transactions(created_at DESC);


CREATE INDEX idx_ledger_entries_transaction
ON ledger_entries(transaction_id);


CREATE INDEX idx_audit_logs_created
ON audit_logs(created_at DESC);
