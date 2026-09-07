ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_status
VARCHAR(30)
NOT NULL DEFAULT 'active';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at
TIMESTAMPTZ
NOT NULL DEFAULT NOW();

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at
TIMESTAMPTZ;


CREATE INDEX IF NOT EXISTS idx_users_account_status
ON users(account_status);


CREATE INDEX IF NOT EXISTS idx_users_public_id
ON users(public_user_id);
