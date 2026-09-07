CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    account_holder_name VARCHAR(150)
        NOT NULL,

    account_number_encrypted TEXT
        NOT NULL,

    account_number_last4 CHAR(4)
        NOT NULL,

    ifsc_code VARCHAR(20)
        NOT NULL,

    bank_name VARCHAR(150),

    account_type VARCHAR(30)
        NOT NULL DEFAULT 'SAVINGS',

    status VARCHAR(20)
        NOT NULL DEFAULT 'PENDING',

    is_primary BOOLEAN
        NOT NULL DEFAULT FALSE,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT bank_account_status
        CHECK (
            status IN (
                'PENDING',
                'VERIFIED',
                'REJECTED',
                'DISABLED'
            )
        )
);


CREATE INDEX idx_bank_accounts_user
ON bank_accounts(user_id);


CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    withdrawal_id VARCHAR(64)
        UNIQUE
        NOT NULL,

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    bank_account_id UUID
        NOT NULL
        REFERENCES bank_accounts(id)
        ON DELETE RESTRICT,

    amount NUMERIC(20,2)
        NOT NULL,

    fee NUMERIC(20,2)
        NOT NULL DEFAULT 0,

    net_amount NUMERIC(20,2)
        NOT NULL,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    user_note TEXT,

    admin_note TEXT,

    provider_reference VARCHAR(150),

    reviewed_by UUID
        REFERENCES users(id),

    reviewed_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT withdrawal_amount_positive
        CHECK (amount > 0),

    CONSTRAINT withdrawal_fee_non_negative
        CHECK (fee >= 0),

    CONSTRAINT withdrawal_net_positive
        CHECK (net_amount > 0),

    CONSTRAINT withdrawal_status_valid
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'PROCESSING',
                'COMPLETED',
                'REJECTED',
                'CANCELLED',
                'FAILED'
            )
        )
);


CREATE INDEX idx_withdrawals_user
ON withdrawals(user_id, created_at DESC);


CREATE INDEX idx_withdrawals_status
ON withdrawals(status, created_at DESC);
