CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100)
        NOT NULL,

    entity_type VARCHAR(50)
        NOT NULL,

    entity_id VARCHAR(100),

    before_data JSONB,

    after_data JSONB,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_audit_logs_actor
ON audit_logs(actor_user_id, created_at DESC);


CREATE INDEX idx_audit_logs_entity
ON audit_logs(entity_type, entity_id);


CREATE INDEX idx_audit_logs_created
ON audit_logs(created_at DESC);
