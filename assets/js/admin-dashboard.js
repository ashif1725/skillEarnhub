"use strict";


/* =========================================================
   SKILLEARN HUB — ADMIN DASHBOARD
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    function () {


        /* =================================================
           API CHECK
        ================================================= */

        if (

            typeof window.apiRequest !==
            "function"

        ) {

            console.error(
                "ADMIN DASHBOARD ERROR: apiRequest is not available."
            );


            return;

        }


        /* =================================================
           ELEMENTS
        ================================================= */

        const sidebar =
            document.getElementById(
                "dashboardSidebar"
            );


        const overlay =
            document.getElementById(
                "sidebarOverlay"
            );


        const mobileMenuButton =
            document.getElementById(
                "mobileMenuButton"
            );


        const navItems =
            document.querySelectorAll(
                ".nav-item[data-section]"
            );


        const sections =
            document.querySelectorAll(
                ".dashboard-section"
            );


        const quickActionButtons =
            document.querySelectorAll(
                "[data-open-section]"
            );


        const refreshUsersButton =
            document.getElementById(
                "refreshUsersButton"
            );


        const refreshDepositsButton =
            document.getElementById(
                "refreshDepositsButton"
            );


        /* =================================================
           STATE
        ================================================= */

        let currentUsers =
            [];


        let currentDeposits =
            [];


        /* =================================================
           BASIC HELPERS
        ================================================= */

        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (
                !element
            ) {

                return;

            }


            if (

                value ===
                null

                ||

                value ===
                undefined

                ||

                value ===
                ""

            ) {

                element.textContent =
                    "—";


                return;

            }


            element.textContent =
                String(
                    value
                );

        }


        function escapeHtml(
            value
        ) {

            const element =
                document.createElement(
                    "div"
                );


            element.textContent =

                value ===
                null

                ||

                value ===
                undefined

                    ?

                    ""

                    :

                    String(
                        value
                    );


            return element.innerHTML;

        }


        function escapeAttribute(
            value
        ) {

            return escapeHtml(
                value
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

        }


        function getInitial(
            value
        ) {

            const text =
                String(
                    value ||
                    "A"
                )
                .trim();


            return (

                text.charAt(
                    0
                )

                ||

                "A"

            )
            .toUpperCase();

        }


        function formatAmount(
            amount,
            currency =
                "INR"
        ) {

            const number =
                Number(
                    amount
                );


            const safeAmount =
                Number.isFinite(
                    number
                )

                    ?

                    number

                    :

                    0;


            return (

                String(
                    currency ||
                    "INR"
                )

                +

                " "

                +

                safeAmount.toLocaleString(

                    "en-IN",

                    {

                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2

                    }

                )

            );

        }


        function formatDate(
            value
        ) {

            if (
                !value
            ) {

                return "—";

            }


            try {

                const date =
                    new Date(
                        value
                    );


                if (

                    Number.isNaN(
                        date.getTime()
                    )

                ) {

                    return String(
                        value
                    );

                }


                return date.toLocaleString(
                    "en-IN"
                );


            } catch (
                error
            ) {

                return String(
                    value
                );

            }

        }


        function getApiErrorMessage(
            error,
            fallback
        ) {

            return (

                error?.data?.message ||

                error?.data?.error ||

                error?.message ||

                fallback

            );

        }


        /* =================================================
           RESPONSE ARRAY EXTRACTOR
        ================================================= */

        function getArrayFromResponse(
            data,
            key
        ) {

            if (
                Array.isArray(
                    data?.[key]
                )
            ) {

                return data[
                    key
                ];

            }


            if (
                Array.isArray(
                    data?.data?.[key]
                )
            ) {

                return data.data[
                    key
                ];

            }


            if (
                Array.isArray(
                    data?.data
                )
            ) {

                return data.data;

            }


            if (
                Array.isArray(
                    data
                )
            ) {

                return data;

            }


            return [];

        }


        /* =================================================
           MOBILE SIDEBAR
        ================================================= */

        function openSidebar() {

            if (
                sidebar
            ) {

                sidebar.classList.add(
                    "open"
                );

            }


            if (
                overlay
            ) {

                overlay.classList.add(
                    "visible"
                );

            }

        }


        function closeSidebar() {

            if (
                sidebar
            ) {

                sidebar.classList.remove(
                    "open"
                );

            }


            if (
                overlay
            ) {

                overlay.classList.remove(
                    "visible"
                );

            }

        }


        if (
            mobileMenuButton
        ) {

            mobileMenuButton.addEventListener(

                "click",

                function () {

                    if (

                        sidebar &&

                        sidebar.classList.contains(
                            "open"
                        )

                    ) {

                        closeSidebar();

                    }

                    else {

                        openSidebar();

                    }

                }

            );

        }


        if (
            overlay
        ) {

            overlay.addEventListener(
                "click",
                closeSidebar
            );

        }


        /* =================================================
           ADMIN MESSAGE
        ================================================= */

        function showMessage(
            message,
            type =
                "info"
        ) {

            let element =
                document.getElementById(
                    "adminActionMessage"
                );


            if (
                !element
            ) {

                element =
                    document.createElement(
                        "div"
                    );


                element.id =
                    "adminActionMessage";


                element.style.position =
                    "fixed";


                element.style.left =
                    "20px";


                element.style.right =
                    "20px";


                element.style.bottom =
                    "20px";


                element.style.zIndex =
                    "99999";


                element.style.padding =
                    "16px";


                element.style.borderRadius =
                    "12px";


                element.style.fontWeight =
                    "700";


                element.style.textAlign =
                    "center";


                element.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.25)";


                document.body.appendChild(
                    element
                );

            }


            element.textContent =
                message ||
                "";


            if (
                type ===
                "success"
            ) {

                element.style.background =
                    "#dcfce7";


                element.style.color =
                    "#166534";


                element.style.border =
                    "1px solid #86efac";

            }

            else if (
                type ===
                "error"
            ) {

                element.style.background =
                    "#fee2e2";


                element.style.color =
                    "#991b1b";


                element.style.border =
                    "1px solid #fca5a5";

            }

            else {

                element.style.background =
                    "#dbeafe";


                element.style.color =
                    "#1e40af";


                element.style.border =
                    "1px solid #93c5fd";

            }


            element.style.display =
                "block";


            clearTimeout(
                window.__adminMessageTimer
            );


            window.__adminMessageTimer =
                setTimeout(

                    function () {

                        element.style.display =
                            "none";

                    },

                    4000

                );

        }


        /* =================================================
           ADMIN PROFILE
        ================================================= */

        function loadAdminProfile() {

            try {

                const user =

                    typeof window.getSavedUser ===
                    "function"

                        ?

                        window.getSavedUser()

                        :

                        null;


                if (
                    !user
                ) {

                    return;

                }


                const name =

                    user.full_name ||

                    user.fullName ||

                    user.name ||

                    "Admin";


                const email =
                    user.email ||
                    "—";


                const role =

                    user.role ||

                    user.user_role ||

                    user.userRole ||

                    "admin";


                setText(
                    "adminName",
                    name
                );


                setText(
                    "adminEmail",
                    email
                );


                setText(
                    "adminWelcomeName",
                    name
                );


                setText(
                    "adminProfileName",
                    name
                );


                setText(
                    "adminProfileEmail",
                    email
                );


                setText(
                    "adminRole",
                    role
                );


                setText(
                    "topbarName",
                    name
                );


                setText(
                    "adminAvatar",
                    getInitial(
                        name
                    )
                );


                setText(
                    "topbarAvatar",
                    getInitial(
                        name
                    )
                );


            } catch (
                error
            ) {

                console.error(
                    "ADMIN PROFILE ERROR:",
                    error
                );

            }

        }


        /* =================================================
           USER NORMALIZER
        ================================================= */

        function normalizeUser(
            user
        ) {

            return {

                database_id:

                    user.id ||

                    user.user_id ||

                    user.user_uuid ||

                    null,


                public_user_id:

                    user.public_user_id ||

                    user.user_code ||

                    user.public_id ||

                    user.userId ||

                    user.id ||

                    "—",


                wallet_id:

                    user.wallet_id ||

                    user.walletId ||

                    user.wallet?.id ||

                    "—",


                full_name:

                    user.full_name ||

                    user.fullName ||

                    user.name ||

                    user.user_name ||

                    "User",


                email:

                    user.email ||

                    user.user_email ||

                    "—",


                phone:

                    user.phone ||

                    user.mobile ||

                    user.mobile_number ||

                    user.phone_number ||

                    "—",


                available_balance:

                    user.available_balance ??

                    user.balance ??

                    user.wallet?.available_balance ??

                    0,


                pending_balance:

                    user.pending_balance ??

                    user.wallet?.pending_balance ??

                    0,


                currency:

                    user.currency ||

                    user.wallet?.currency ||

                    "INR",


                status:

                    user.status ||

                    user.user_status ||

                    "active",


                created_at:

                    user.created_at ||

                    user.createdAt ||

                    null

            };

        }


        /* =================================================
           LOAD USERS
        ================================================= */

        async function loadUsers() {

            const usersList =
                document.getElementById(
                    "usersList"
                );


            const usersMessage =
                document.getElementById(
                    "usersMessage"
                );


            if (
                !usersList
            ) {

                return;

            }


            usersList.innerHTML =
                `
                <div class="empty-state">

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <strong>
                        Loading users...
                    </strong>

                </div>
                `;


            if (
                usersMessage
            ) {

                usersMessage.style.display =
                    "none";

            }


            try {

                const response =
                    await window.apiRequest(

                        "/api/admin/users",

                        {

                            method:
                                "GET"

                        }

                    );


                console.log(
                    "ADMIN USERS API RESPONSE:",
                    response
                );


                const users =
                    getArrayFromResponse(
                        response,
                        "users"
                    )
                    .map(
                        normalizeUser
                    );


                currentUsers =
                    users;


                setText(
                    "totalUsers",
                    users.length
                );


                renderUsers(
                    users
                );


            } catch (
                error
            ) {

                console.error(
                    "LOAD USERS ERROR:",
                    error
                );


                const message =
                    getApiErrorMessage(

                        error,

                        "Unable to load users."

                    );


                usersList.innerHTML =
                    `
                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <strong>
                            Unable to load users
                        </strong>

                        <p>
                            ${escapeHtml(
                                message
                            )}
                        </p>

                    </div>
                    `;


                if (
                    usersMessage
                ) {

                    usersMessage.style.display =
                        "block";


                    usersMessage.textContent =
                        message;

                }

            }

        }


        /* =================================================
           RENDER USERS
        ================================================= */

        function renderUsers(
            users
        ) {

            const usersList =
                document.getElementById(
                    "usersList"
                );


            if (
                !usersList
            ) {

                return;

            }


            if (

                !Array.isArray(
                    users
                )

                ||

                users.length ===
                0

            ) {

                usersList.innerHTML =
                    `
                    <div class="empty-state">

                        <div class="empty-icon">
                            👥
                        </div>

                        <strong>
                            No users found
                        </strong>

                    </div>
                    `;


                return;

            }


            usersList.innerHTML =
                users.map(

                    function (
                        user
                    ) {

                        const safeStatus =
                            String(
                                user.status ||
                                "active"
                            )
                            .trim()
                            .toLowerCase();


                        return `
                        <div
                            class="content-card"
                            style="
                                margin-bottom:16px;
                                padding:20px;
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    gap:16px;
                                    flex-wrap:wrap;
                                    align-items:flex-start;
                                "
                            >

                                <div>

                                    <strong
                                        style="
                                            font-size:20px;
                                        "
                                    >
                                        ${escapeHtml(
                                            user.full_name
                                        )}
                                    </strong>

                                    <p
                                        style="
                                            margin-top:8px;
                                            opacity:.75;
                                        "
                                    >
                                        User Account Details
                                    </p>

                                </div>


                                <div
                                    style="
                                        padding:6px 12px;
                                        border-radius:999px;
                                        border:1px solid rgba(255,255,255,.15);
                                    "
                                >
                                    ${escapeHtml(
                                        safeStatus
                                    )}
                                </div>

                            </div>


                            <div
                                style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(
                                            auto-fit,
                                            minmax(220px,1fr)
                                        );
                                    gap:14px;
                                    margin-top:20px;
                                "
                            >

                                <div>

                                    <small>
                                        User ID
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                user.public_user_id
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Wallet ID
                                    </small>

                                    <div
                                        style="
                                            word-break:break-all;
                                        "
                                    >
                                        <strong>
                                            ${escapeHtml(
                                                user.wallet_id
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Full Name
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                user.full_name
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Available Balance
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                formatAmount(
                                                    user.available_balance,
                                                    user.currency
                                                )
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Pending Balance
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                formatAmount(
                                                    user.pending_balance,
                                                    user.currency
                                                )
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Email
                                    </small>

                                    <div
                                        style="
                                            word-break:break-word;
                                        "
                                    >
                                        <strong>
                                            ${escapeHtml(
                                                user.email
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Mobile Number
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                user.phone
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Account Status
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                safeStatus
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div>

                                    <small>
                                        Joined Date
                                    </small>

                                    <div>
                                        <strong>
                                            ${escapeHtml(
                                                formatDate(
                                                    user.created_at
                                                )
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </div>


                            <div
                                style="
                                    display:flex;
                                    gap:10px;
                                    flex-wrap:wrap;
                                    margin-top:22px;
                                "
                            >

                                <button
                                    type="button"
                                    class="admin-user-action"
                                    data-user-id="${escapeAttribute(
                                        user.database_id ||
                                        user.public_user_id
                                    )}"
                                    data-user-status="active"
                                >
                                    Activate
                                </button>


                                <button
                                    type="button"
                                    class="admin-user-action"
                                    data-user-id="${escapeAttribute(
                                        user.database_id ||
                                        user.public_user_id
                                    )}"
                                    data-user-status="blocked"
                                >
                                    Block
                                </button>

                            </div>

                        </div>
                        `;

                    }

                )
                .join(
                    ""
                );


            bindUserActions();

        }


        /* =================================================
           USER ACTIONS
        ================================================= */

        function bindUserActions() {

            document
                .querySelectorAll(
                    ".admin-user-action"
                )
                .forEach(

                    function (
                        button
                    ) {

                        button.addEventListener(

                            "click",

                            async function () {

                                const userId =
                                    button.dataset.userId;


                                const status =
                                    button.dataset.userStatus;


                                if (
                                    !userId
                                ) {

                                    showMessage(
                                        "User ID not found.",
                                        "error"
                                    );


                                    return;

                                }


                                const confirmed =
                                    window.confirm(

                                        status ===
                                        "blocked"

                                            ?

                                            "Are you sure you want to block this user?"

                                            :

                                            "Are you sure you want to activate this user?"

                                    );


                                if (
                                    !confirmed
                                ) {

                                    return;

                                }


                                const originalText =
                                    button.textContent;


                                button.disabled =
                                    true;


                                button.textContent =
                                    "Processing...";


                                try {

                                    await window.apiRequest(

                                        "/api/admin/users/" +

                                        encodeURIComponent(
                                            userId
                                        )

                                        +

                                        "/status",

                                        {

                                            method:
                                                "PATCH",

                                            body:
                                                {

                                                    status:
                                                        status

                                                }

                                        }

                                    );


                                    showMessage(

                                        status ===
                                        "blocked"

                                            ?

                                            "User blocked successfully."

                                            :

                                            "User activated successfully.",

                                        "success"

                                    );


                                    await loadUsers();


                                } catch (
                                    error
                                ) {

                                    console.error(
                                        "USER STATUS ERROR:",
                                        error
                                    );


                                    showMessage(

                                        getApiErrorMessage(

                                            error,

                                            "Unable to update user."

                                        ),

                                        "error"

                                    );


                                    button.disabled =
                                        false;


                                    button.textContent =
                                        originalText;

                                }

                            }

                        );

                    }

                );

        }


        /* =================================================
           DEPOSIT NORMALIZER
        ================================================= */

        function normalizeDeposit(
            deposit
        ) {

            return {

                id:

                    deposit.id ||

                    deposit.deposit_id ||

                    deposit.public_deposit_id ||

                    "",


                user_name:

                    deposit.user_name ||

                    deposit.full_name ||

                    deposit.user_full_name ||

                    deposit.customer_name ||

                    "User",


                user_email:

                    deposit.user_email ||

                    deposit.email ||

                    "—",


                user_id:

                    deposit.public_user_id ||

                    deposit.user_id ||

                    "—",


                amount:

                    deposit.amount ??
                    0,


                currency:

                    deposit.currency ||
                    "INR",


                utr:

                    deposit.utr ||

                    deposit.utr_number ||

                    deposit.transaction_reference ||

                    deposit.reference_number ||

                    "—",


                status:

                    deposit.status ||
                    "pending",


                created_at:

                    deposit.created_at ||

                    deposit.createdAt ||

                    null

            };

        }


        /* =================================================
           LOAD DEPOSITS
        ================================================= */

        async function loadDeposits() {

            const depositsList =
                document.getElementById(
                    "depositsList"
                );


            if (
                !depositsList
            ) {

                return;

            }


            depositsList.innerHTML =
                `
                <div class="empty-state">

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <strong>
                        Loading deposit requests...
                    </strong>

                </div>
                `;


            try {

                const response =
                    await window.apiRequest(

                        "/api/admin/deposits/pending",

                        {

                            method:
                                "GET"

                        }

                    );


                console.log(
                    "ADMIN DEPOSITS API RESPONSE:",
                    response
                );


                const deposits =
                    getArrayFromResponse(
                        response,
                        "deposits"
                    )
                    .map(
                        normalizeDeposit
                    );


                currentDeposits =
                    deposits;


                setText(
                    "pendingDeposits",
                    deposits.length
                );


                setText(
                    "totalDeposits",
                    deposits.length
                );


                renderDeposits(
                    deposits
                );


            } catch (
                error
            ) {

                console.error(
                    "LOAD DEPOSITS ERROR:",
                    error
                );


                const message =
                    getApiErrorMessage(

                        error,

                        "Unable to load deposits."

                    );


                depositsList.innerHTML =
                    `
                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <strong>
                            Unable to load deposits
                        </strong>

                        <p>
                            ${escapeHtml(
                                message
                            )}
                        </p>

                    </div>
                    `;

            }

        }


        /* =================================================
           RENDER DEPOSITS
        ================================================= */

        function renderDeposits(
            deposits
        ) {

            const depositsList =
                document.getElementById(
                    "depositsList"
                );


            if (
                !depositsList
            ) {

                return;

            }


            if (

                !Array.isArray(
                    deposits
                )

                ||

                deposits.length ===
                0

            ) {

                depositsList.innerHTML =
                    `
                    <div class="empty-state">

                        <div class="empty-icon">
                            💳
                        </div>

                        <strong>
                            No pending deposit requests
                        </strong>

                    </div>
                    `;


                return;

            }


            depositsList.innerHTML =
                deposits.map(

                    function (
                        deposit
                    ) {

                        return `
                        <div
                            class="content-card"
                            style="
                                margin-bottom:16px;
                                padding:20px;
                            "
                        >

                            <div
                                style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(
                                            auto-fit,
                                            minmax(200px,1fr)
                                        );
                                    gap:14px;
                                "
                            >

                                <div>

                                    <small>
                                        Deposit ID
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            deposit.id
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <small>
                                        User
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            deposit.user_name
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <small>
                                        User ID
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            deposit.user_id
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <small>
                                        Amount
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            formatAmount(
                                                deposit.amount,
                                                deposit.currency
                                            )
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <small>
                                        UTR Number
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            deposit.utr
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <small>
                                        Requested At
                                    </small>

                                    <strong>
                                        ${escapeHtml(
                                            formatDate(
                                                deposit.created_at
                                            )
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <div
                                style="
                                    display:flex;
                                    gap:10px;
                                    flex-wrap:wrap;
                                    margin-top:20px;
                                "
                            >

                                <button
                                    type="button"
                                    class="admin-deposit-action"
                                    data-deposit-id="${escapeAttribute(
                                        deposit.id
                                    )}"
                                    data-action="approve"
                                >
                                    Approve
                                </button>


                                <button
                                    type="button"
                                    class="admin-deposit-action"
                                    data-deposit-id="${escapeAttribute(
                                        deposit.id
                                    )}"
                                    data-action="reject"
                                >
                                    Reject
                                </button>

                            </div>

                        </div>
                        `;

                    }

                )
                .join(
                    ""
                );


            bindDepositActions();

        }


        /* =================================================
           DEPOSIT ACTIONS
        ================================================= */

        function bindDepositActions() {

            document
                .querySelectorAll(
                    ".admin-deposit-action"
                )
                .forEach(

                    function (
                        button
                    ) {

                        button.addEventListener(

                            "click",

                            async function () {

                                const depositId =
                                    button.dataset.depositId;


                                const action =
                                    button.dataset.action;


                                if (
                                    !depositId
                                ) {

                                    showMessage(
                                        "Deposit ID not found.",
                                        "error"
                                    );


                                    return;

                                }


                                const confirmed =
                                    window.confirm(

                                        action ===
                                        "approve"

                                            ?

                                            "Approve this deposit? The user's wallet may be credited."

                                            :

                                            "Reject this deposit?"

                                    );


                                if (
                                    !confirmed
                                ) {

                                    return;

                                }


                                const originalText =
                                    button.textContent;


                                button.disabled =
                                    true;


                                button.textContent =
                                    "Processing...";


                                try {

                                    const endpoint =

                                        action ===
                                        "approve"

                                            ?

                                            "/api/admin/deposits/" +

                                            encodeURIComponent(
                                                depositId
                                            )

                                            +

                                            "/approve"

                                            :

                                            "/api/admin/deposits/" +

                                            encodeURIComponent(
                                                depositId
                                            )

                                            +

                                            "/reject";


                                    await window.apiRequest(

                                        endpoint,

                                        {

                                            method:
                                                "PATCH"

                                        }

                                    );


                                    showMessage(

                                        action ===
                                        "approve"

                                            ?

                                            "Deposit approved successfully."

                                            :

                                            "Deposit rejected successfully.",

                                        "success"

                                    );


                                    await loadDeposits();

                                    await loadUsers();


                                } catch (
                                    error
                                ) {

                                    console.error(
                                        "DEPOSIT ACTION ERROR:",
                                        error
                                    );


                                    showMessage(

                                        getApiErrorMessage(

                                            error,

                                            "Unable to process deposit."

                                        ),

                                        "error"

                                    );


                                    button.disabled =
                                        false;


                                    button.textContent =
                                        originalText;

                                }

                            }

                        );

                    }

                );

        }


        /* =================================================
           SECTION NAVIGATION
        ================================================= */

        function showSection(
            sectionId
        ) {

            sections.forEach(

                function (
                    section
                ) {

                    section.classList.remove(
                        "active-section"
                    );

                }

            );


            const target =
                document.getElementById(
                    sectionId
                );


            if (
                target
            ) {

                target.classList.add(
                    "active-section"
                );

            }


            navItems.forEach(

                function (
                    item
                ) {

                    item.classList.remove(
                        "active"
                    );


                    if (

                        item.dataset.section ===
                        sectionId

                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                }

            );


            closeSidebar();


            window.scrollTo(

                {

                    top:
                        0,

                    behavior:
                        "smooth"

                }

            );


            if (
                sectionId ===
                "users"
            ) {

                loadUsers();

            }


            if (
                sectionId ===
                "deposits"
            ) {

                loadDeposits();

            }

        }


        /* =================================================
           NAVIGATION EVENTS
        ================================================= */

        navItems.forEach(

            function (
                item
            ) {

                item.addEventListener(

                    "click",

                    function (
                        event
                    ) {

                        event.preventDefault();


                        const sectionId =
                            item.dataset.section;


                        if (
                            !sectionId
                        ) {

                            return;

                        }


                        showSection(
                            sectionId
                        );


                        window.history.replaceState(

                            null,

                            "",

                            "#" +
                            sectionId

                        );

                    }

                );

            }

        );


        /* =================================================
           QUICK ACTION EVENTS
        ================================================= */

        quickActionButtons.forEach(

            function (
                button
            ) {

                button.addEventListener(

                    "click",

                    function () {

                        const sectionId =
                            button.dataset.openSection;


                        if (
                            !sectionId
                        ) {

                            return;

                        }


                        showSection(
                            sectionId
                        );


                        window.history.replaceState(

                            null,

                            "",

                            "#" +
                            sectionId

                        );

                    }

                );

            }

        );


        /* =================================================
           REFRESH BUTTONS
        ================================================= */

        if (
            refreshUsersButton
        ) {

            refreshUsersButton.addEventListener(

                "click",

                async function () {

                    refreshUsersButton.disabled =
                        true;


                    const originalText =
                        refreshUsersButton.textContent;


                    refreshUsersButton.textContent =
                        "Refreshing...";


                    try {

                        await loadUsers();


                        showMessage(
                            "Users refreshed successfully.",
                            "success"
                        );

                    } finally {

                        refreshUsersButton.disabled =
                            false;


                        refreshUsersButton.textContent =
                            originalText;

                    }

                }

            );

        }


        if (
            refreshDepositsButton
        ) {

            refreshDepositsButton.addEventListener(

                "click",

                async function () {

                    refreshDepositsButton.disabled =
                        true;


                    const originalText =
                        refreshDepositsButton.textContent;


                    refreshDepositsButton.textContent =
                        "Refreshing...";


                    try {

                        await loadDeposits();


                        showMessage(
                            "Deposits refreshed successfully.",
                            "success"
                        );

                    } finally {

                        refreshDepositsButton.disabled =
                            false;


                        refreshDepositsButton.textContent =
                            originalText;

                    }

                }

            );

        }


        /* =================================================
           INITIAL LOAD
        ================================================= */

        loadAdminProfile();


        const hash =
            String(
                window.location.hash ||
                ""
            )
            .replace(
                "#",
                ""
            );


        if (

            hash ===
            "users"

            ||

            hash ===
            "deposits"

            ||

            hash ===
            "overview"

        ) {

            showSection(
                hash
            );

        }


        /*
        --------------------------------------------------
        Dashboard statistics
        --------------------------------------------------
        */

        loadUsers();


        loadDeposits();


        /* =================================================
           PUBLIC DEBUG API
        ================================================= */

        window.SkillEarnAdminDashboard = {

            loadUsers,

            loadDeposits,

            showSection,

            getUsers:
                function () {

                    return currentUsers;

                },

            getDeposits:
                function () {

                    return currentDeposits;

                }

        };


    }

);
