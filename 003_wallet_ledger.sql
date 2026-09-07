CREATE TABLE wallet_balances (
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


CREATE TABLE transaction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id UUID
        NOT NULL
        REFERENCES transactions(id)
        ON DELETE RESTRICT,

    event_type VARCHAR(40)
        NOT NULL,

    event_data JSONB,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_transaction_events_transaction
ON transaction_events(transaction_id);


CREATE INDEX idx_transactions_status
ON transactions(status);


CREATE INDEX idx_transactions_type
ON transactions(type);
