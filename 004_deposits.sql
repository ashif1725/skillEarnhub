CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    method_type VARCHAR(30)
        NOT NULL DEFAULT 'UPI',

    display_name VARCHAR(100)
        NOT NULL,

    upi_id VARCHAR(255),

    qr_image_url TEXT,

    instructions TEXT,

    is_active BOOLEAN
        NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    deposit_id VARCHAR(64)
        UNIQUE
        NOT NULL,

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    payment_method_id UUID
        REFERENCES payment_methods(id)
        ON DELETE RESTRICT,

    amount NUMERIC(20,2)
        NOT NULL,

    currency CHAR(3)
        NOT NULL DEFAULT 'INR',

    utr_number VARCHAR(100),

    status VARCHAR(20)
        NOT NULL DEFAULT 'PENDING',

    user_note TEXT,

    admin_note TEXT,

    submitted_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    reviewed_at TIMESTAMPTZ,

    reviewed_by UUID
        REFERENCES users(id),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT deposit_amount_positive
        CHECK (amount > 0),

    CONSTRAINT deposit_status_valid
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED',
                'CANCELLED'
            )
        )
);


CREATE UNIQUE INDEX idx_deposits_utr
ON deposits(utr_number)
WHERE utr_number IS NOT NULL;


CREATE INDEX idx_deposits_user
ON deposits(user_id, created_at DESC);


CREATE INDEX idx_deposits_status
ON deposits(status, created_at DESC);
