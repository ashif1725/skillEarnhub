BEGIN;


/* =========================================================
   SkillEarn Hub
   Migration 010
   Platform Features
   ========================================================= */


/* =========================================================
   EXISTING PAYMENT METHODS TABLE
   =========================================================

   payment_methods table already exists in migration 004.

   We only add the administrator tracking column.
*/


ALTER TABLE payment_methods

ADD COLUMN IF NOT EXISTS created_by UUID
REFERENCES users(id)
ON DELETE SET NULL;


/* =========================================================
   REFERRAL USER FIELDS
   ========================================================= */


ALTER TABLE users

ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);


ALTER TABLE users

ADD COLUMN IF NOT EXISTS referred_by_user_id UUID
REFERENCES users(id)
ON DELETE SET NULL;


/* =========================================================
   UNIQUE REFERRAL CODE
   ========================================================= */


CREATE UNIQUE INDEX IF NOT EXISTS
idx_users_referral_code_unique

ON users(referral_code)

WHERE referral_code IS NOT NULL;


/* =========================================================
   COURSES
   ========================================================= */


CREATE TABLE IF NOT EXISTS courses (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),


    title VARCHAR(160)
        NOT NULL,


    description TEXT,


    price NUMERIC(20,2)
        NOT NULL
        DEFAULT 0,


    status VARCHAR(20)
        NOT NULL
        DEFAULT 'draft',


    thumbnail_url TEXT,


    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,


    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),


    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),


    CONSTRAINT courses_price_valid

        CHECK (
            price >= 0
        ),


    CONSTRAINT courses_status_valid

        CHECK (
            status IN (
                'draft',
                'published',
                'archived'
            )
        )

);


/* =========================================================
   COURSE INDEXES
   ========================================================= */


CREATE INDEX IF NOT EXISTS
idx_courses_status

ON courses(
    status,
    created_at DESC
);


/* =========================================================
   REFERRAL SETTINGS
   =========================================================

   Default rule:

   80% = Referrer
   20% = Platform

   Total must always be exactly 100%.
*/


CREATE TABLE IF NOT EXISTS referral_settings (

    id SMALLINT PRIMARY KEY
        DEFAULT 1,


    referrer_percent NUMERIC(5,2)
        NOT NULL
        DEFAULT 80.00,


    platform_percent NUMERIC(5,2)
        NOT NULL
        DEFAULT 20.00,


    enabled BOOLEAN
        NOT NULL
        DEFAULT TRUE,


    updated_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,


    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),


    CONSTRAINT referral_settings_single_row

        CHECK (
            id = 1
        ),


    CONSTRAINT referral_percent_range

        CHECK (

            referrer_percent >= 0

            AND

            referrer_percent <= 100

        ),


    CONSTRAINT platform_percent_range

        CHECK (

            platform_percent >= 0

            AND

            platform_percent <= 100

        ),


    CONSTRAINT referral_percent_total

        CHECK (

            referrer_percent
            +
            platform_percent

            =
            100

        )

);


/* =========================================================
   INSERT DEFAULT 80 / 20 SETTINGS
   ========================================================= */


INSERT INTO referral_settings (

    id,

    referrer_percent,

    platform_percent,

    enabled

)

VALUES (

    1,

    80.00,

    20.00,

    TRUE

)

ON CONFLICT (id)

DO NOTHING;


/* =========================================================
   COURSE ORDERS
   =========================================================

   User buys a course.

   Payment is initially PENDING.

   After verification:

   APPROVED

   Then referral commission is calculated
   server-side.
*/


CREATE TABLE IF NOT EXISTS course_orders (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),


    order_id VARCHAR(64)
        UNIQUE
        NOT NULL,


    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,


    course_id UUID
        NOT NULL
        REFERENCES courses(id)
        ON DELETE RESTRICT,


    amount NUMERIC(20,2)
        NOT NULL,


    currency CHAR(3)
        NOT NULL
        DEFAULT 'INR',


    status VARCHAR(20)
        NOT NULL
        DEFAULT 'PENDING',


    payment_method_id UUID
        REFERENCES payment_methods(id)
        ON DELETE SET NULL,


    utr_number VARCHAR(100),


    admin_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,


    admin_note TEXT,


    rejection_reason TEXT,


    approved_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),


    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),


    CONSTRAINT course_orders_amount_valid

        CHECK (
            amount >= 0
        ),


    CONSTRAINT course_orders_status_valid

        CHECK (

            status IN (

                'PENDING',

                'APPROVED',

                'REJECTED',

                'CANCELLED'

            )

        )

);


/* =========================================================
   COURSE ORDER INDEXES
   ========================================================= */


CREATE INDEX IF NOT EXISTS
idx_course_orders_user

ON course_orders(
    user_id,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS
idx_course_orders_status

ON course_orders(
    status,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS
idx_course_orders_course

ON course_orders(
    course_id,
    created_at DESC
);


/* =========================================================
   REFERRAL COMMISSIONS
   =========================================================

   One approved course order can create
   only one referral commission record.
*/


CREATE TABLE IF NOT EXISTS referral_commissions (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),


    order_id UUID
        NOT NULL
        UNIQUE
        REFERENCES course_orders(id)
        ON DELETE CASCADE,


    referrer_user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,


    referred_user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,


    course_id UUID
        NOT NULL
        REFERENCES courses(id)
        ON DELETE RESTRICT,


    sale_amount NUMERIC(20,2)
        NOT NULL,


    commission_percent NUMERIC(5,2)
        NOT NULL,


    commission_amount NUMERIC(20,2)
        NOT NULL,


    platform_percent NUMERIC(5,2)
        NOT NULL,


    platform_amount NUMERIC(20,2)
        NOT NULL,


    status VARCHAR(20)
        NOT NULL
        DEFAULT 'pending',


    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),


    credited_at TIMESTAMPTZ,


    CONSTRAINT referral_commission_sale_valid

        CHECK (
            sale_amount >= 0
        ),


    CONSTRAINT referral_commission_amount_valid

        CHECK (
            commission_amount >= 0
        ),


    CONSTRAINT referral_platform_amount_valid

        CHECK (
            platform_amount >= 0
        ),


    CONSTRAINT referral_commission_percent_valid

        CHECK (

            commission_percent >= 0

            AND

            commission_percent <= 100

        ),


    CONSTRAINT referral_platform_percent_valid

        CHECK (

            platform_percent >= 0

            AND

            platform_percent <= 100

        ),


    CONSTRAINT referral_commission_status_valid

        CHECK (

            status IN (

                'pending',

                'credited',

                'rejected'

            )

        )

);


/* =========================================================
   REFERRAL COMMISSION INDEXES
   ========================================================= */


CREATE INDEX IF NOT EXISTS
idx_referral_commissions_referrer

ON referral_commissions(
    referrer_user_id,
    status,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS
idx_referral_commissions_referred

ON referral_commissions(
    referred_user_id,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS
idx_referral_commissions_status

ON referral_commissions(
    status,
    created_at DESC
);


/* =========================================================
   AUDIT INDEX
   ========================================================= */


CREATE INDEX IF NOT EXISTS
idx_audit_logs_actor_created

ON audit_logs(
    actor_user_id,
    created_at DESC
);


/* =========================================================
   COMMIT
   ========================================================= */


COMMIT;
