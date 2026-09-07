CREATE TABLE kyc_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        UNIQUE
        REFERENCES users(id)
        ON DELETE RESTRICT,

    full_name VARCHAR(150)
        NOT NULL,

    date_of_birth DATE,

    address_line1 TEXT,

    address_line2 TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    postal_code VARCHAR(20),

    country VARCHAR(100)
        NOT NULL DEFAULT 'India',

    status VARCHAR(30)
        NOT NULL DEFAULT 'NOT_SUBMITTED',

    rejection_reason TEXT,

    admin_note TEXT,

    submitted_at TIMESTAMPTZ,

    reviewed_at TIMESTAMPTZ,

    reviewed_by UUID
        REFERENCES users(id),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT kyc_status_valid
    CHECK (
        status IN (
            'NOT_SUBMITTED',
            'PENDING',
            'UNDER_REVIEW',
            'VERIFIED',
            'REJECTED',
            'RESUBMISSION_REQUIRED'
        )
    )
);


CREATE INDEX idx_kyc_status
ON kyc_profiles(status);


CREATE INDEX idx_kyc_user
ON kyc_profiles(user_id);
