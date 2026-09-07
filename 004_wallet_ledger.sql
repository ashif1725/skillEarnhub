CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id VARCHAR(64)
        UNIQUE
        NOT NULL,

    type VARCHAR(40)
        NOT NULL,

    status VARCHAR(20)
        NOT NULL DEFAULT 'PENDING',

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    amount NUMERIC(20,2)
        NOT NULL,

    sender_user_id UUID
        REFERENCES users(id),

    receiver_user_id UUID
        REFERENCES users(id),

    description VARCHAR(255),

    idempotency_key VARCHAR(128)
        UNIQUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT transaction_amount_positive
        CHECK (amount > 0)
);


CREATE INDEX idx_transactions_sender
ON transactions(sender_user_id, created_at DESC);


CREATE INDEX idx_transactions_receiver
ON transactions(receiver_user_id, created_at DESC);


CREATE INDEX idx_transactions_created
ON transactions(created_at DESC);
