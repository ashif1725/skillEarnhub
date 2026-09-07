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
        NOT NULL,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT ledger_amount_positive
        CHECK (amount > 0),

    CONSTRAINT ledger_entry_type
        CHECK (
            entry_type IN ('DEBIT', 'CREDIT')
        )
);


CREATE INDEX idx_ledger_transaction
ON ledger_entries(transaction_id);


CREATE INDEX idx_ledger_account
ON ledger_entries(ledger_account_id);
