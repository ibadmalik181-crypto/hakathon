/* ==========================================
   HCM Lite - Authentication System
   File: js/auth.js
========================================== */

(() => {
    "use strict";

    // Get HTML elements
    const setupSection = document.getElementById("setupSection");
    const loginSection = document.getElementById("loginSection");
    const dashboardSection = document.getElementById("dashboardSection");

    const setupForm = document.getElementById("setupForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");

    const currentUserElement = document.getElementById("currentUser");
    const messageBox = document.getElementById("messageBox");

    // Show a message to the user
    function showMessage(message, type = "info") {
        if (!messageBox) {
            alert(message);
            return;
        }

        messageBox.textContent = message;
        messageBox.className = "message";

        if (type === "success") {
            messageBox.classList.add("success");
        } else if (type === "error") {
            messageBox.classList.add("error");
        }

        messageBox.classList.remove("hidden");
    }

    // Hide all authentication and dashboard sections
    function hideAllSections() {
        setupSection?.classList.add("hidden");
        loginSection?.classList.add("hidden");
        dashboardSection?.classList.add("hidden");
    }

    // Display the correct section
    function showSection(section) {
        hideAllSections();
        section?.classList.remove("hidden");
    }

    // Get a user by ID
    function getUserById(userId) {
        const data = HCMStorage.getData();

        return data.users.find(user => user.id === userId) || null;
    }

    // Get the currently logged-in user
    function getCurrentUser() {
        const session = HCMStorage.getSession();

        if (!session) {
            return null;
        }

        const user = getUserById(session.id);

        if (!user || user.active === false) {
            HCMStorage.clearSession();
            return null;
        }

        return user;
    }

    // Update the interface after login
    function openDashboard(user) {
        if (!user) {
            return;
        }

        showSection(dashboardSection);

        if (currentUserElement) {
            currentUserElement.textContent =
                ${user.name} (${user.role});
        }

        if (logoutBtn) {
            logoutBtn.classList.remove("hidden");
        }

        // Let app.js refresh the dashboard if it provides this function
        if (typeof window.initializeDashboard === "function") {
            window.initializeDashboard(user);
        }

        window.dispatchEvent(
            new CustomEvent("hcm:login", {
                detail: {
                    id: user.id,
                    role: user.role,
                    name: user.name,
                    email: user.email
                }
            })
        );
    }

    // Set up the company and first administrator
    function handleSetup(event) {
        event.preventDefault();

        const companyName =
            document.getElementById("companyName").value.trim();

        const adminName =
            document.getElementById("adminName").value.trim();

        const adminEmail =
            document.getElementById("adminEmail").value.trim().toLowerCase();

        const adminPassword =
            document.getElementById("adminPassword").value;

        if (!companyName || !adminName || !adminEmail || !adminPassword) {
            showMessage("Please complete all fields.", "error");
            return;
        }

        if (adminPassword.length < 6) {
            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );
            return;
        }

        if (HCMStorage.isSetupComplete()) {
            showMessage(
                "Company setup is already complete. Please log in.",
                "error"
            );

            showSection(loginSection);
            return;
        }

        const data = HCMStorage.getData();

        const admin = {
            id: HCMStorage.createId("user"),
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "admin",
            active: true,
            createdAt: new Date().toISOString()
        };

        data.company = {
            id: HCMStorage.createId("company"),
            name: companyName,
            createdAt: new Date().toISOString()
        };

        data.users.push(admin);

        if (!HCMStorage.saveData(data)) {
            showMessage(
                "Could not save the setup. Check browser storage.",
                "error"
            );
            return;
        }

        setupForm.reset();

        showMessage(
            "Company created successfully! Please log in.",
            "success"
        );

        showSection(loginSection);

        document.getElementById("loginEmail").value = adminEmail;
        document.getElementById("loginPassword").value = "";

        document.getElementById("loginPassword").focus();
    }

    // Log in an administrator or employee
    function handleLogin(event) {
        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim().toLowerCase();

        const password =
            document.getElementById("loginPassword").value;

        if (!email || !password) {
            showMessage("Please enter your email and password.", "error");
            return;
        }

        const data = HCMStorage.getData();

        const user = data.users.find(
            item =>
                item.email.toLowerCase() === email &&
                item.password === password
        );

        if (!user) {
            showMessage("Incorrect email or password.", "error");
            return;
        }

        if (user.active === false) {
            showMessage(
                "Your account is inactive. Contact the administrator.",
                "error"
            );
            return;
        }

        if (!HCMStorage.saveSession(user)) {
            showMessage("Could not create your login session.", "error");
            return;
        }

        loginForm.reset();
        openDashboard(user);

        showMessage(
            Welcome, ${user.name}!,
            "success"
        );
    }

    // Log out the current user
    function handleLogout() {
        HCMStorage.clearSession();

        if (currentUserElement) {
            currentUserElement.textContent = "Welcome";
        }

        logoutBtn?.classList.add("hidden");

        if (HCMStorage.isSetupComplete()) {
            showSection(loginSection);
        } else {
            showSection(setupSection);
        }

        showMessage("You have logged out.", "success");

        window.dispatchEvent(new Event("hcm:logout"));
    }

    // Initialize the authentication interface
    function initAuth() {
        if (setupForm) {
            setupForm.addEventListener("submit", handleSetup);
        }

        if (loginForm) {
            loginForm.addEventListener("submit", handleLogin);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }

        const session = HCMStorage.getSession();
        const currentUser = getCurrentUser();

        if (currentUser && session) {
            openDashboard(currentUser);
            return;
        }

        if (HCMStorage.isSetupComplete()) {
            showSection(loginSection);
        } else {
            showSection(setupSection);
        }
    }

    // Make authentication functions available to app.js
    window.HCMAuth = {
        initAuth,
        getCurrentUser,
        getUserById,
        handleLogout,
        showMessage,
        openDashboard
    };

    // Initialize when the HTML is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAuth);
    } else {
        initAuth();
    }




    
/* ==========================================
   HCM Lite - Storage Manager
   File: js/storage.js
   Purpose: Save and manage data using localStorage
========================================== */

const HCMStorage = (() => {
    "use strict";

    // Local storage keys
    const DATA_KEY = "hcm_lite_data";
    const SESSION_KEY = "hcm_lite_session";

    // Default application data
    function getDefaultData() {
        return {
            company: null,

            users: [],

            attendance: [],

            leaves: [],

            settings: {
                officeStartTime: "09:00",
                halfDayAfter: "12:00",
                officeEndTime: "17:00",
                annualLeaveQuota: 20,
                sickLeaveQuota: 10
            }
        };
    }

    // Read all application data
    function getData() {
        try {
            const savedData = localStorage.getItem(DATA_KEY);

            if (!savedData) {
                return getDefaultData();
            }

            const parsedData = JSON.parse(savedData);

            // Ensure required properties exist
            return {
                ...getDefaultData(),
                ...parsedData,

                settings: {
                    ...getDefaultData().settings,
                    ...(parsedData.settings || {})
                },

                users: Array.isArray(parsedData.users)
                    ? parsedData.users
                    : [],

                attendance: Array.isArray(parsedData.attendance)
                    ? parsedData.attendance
                    : [],

                leaves: Array.isArray(parsedData.leaves)
                    ? parsedData.leaves
                    : []
            };
        } catch (error) {
            console.error("Error reading HCM data:", error);
            return getDefaultData();
        }
    }

    // Save all application data
    function saveData(data) {
        try {
            localStorage.setItem(
                DATA_KEY,
                JSON.stringify(data)
            );

            return true;
        } catch (error) {
            console.error("Error saving HCM data:", error);
            return false;
        }
    }

    // Update application data
    function updateData(updater) {
        const currentData = getData();

        let updatedData;

        if (typeof updater === "function") {
            updatedData = updater(currentData);
        } else {
            updatedData = {
                ...currentData,
                ...updater
            };
        }

        if (updatedData === undefined || updatedData === null) {
            return false;
        }

        return saveData(updatedData);
    }

    // Check whether initial setup is complete
    function isSetupComplete() {
        const data = getData();

        return Boolean(
            data.company &&
            data.users.some(user => user.role === "admin")
        );
    }

    // Get current login session
    function getSession() {
        try {
            const session = localStorage.getItem(SESSION_KEY);

            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error("Error reading session:", error);
            return null;
        }
    }

    // Save current login session
    function saveSession(user) {
        try {
            const session = {
                userId: user.id,
                role: user.role,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

            return true;
        } catch (error) {
            console.error("Error saving session:", error);
            return false;
        }
    }

    // Clear current login session
    function clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY);
            return true;
        } catch (error) {
            console.error("Error clearing session:", error);
            return false;
        }
    }

    // Generate a unique ID
    function createId(prefix = "hcm") {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return ${prefix}_${crypto.randomUUID()};
        }

        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).slice(2, 10)
        );
    }

    // Reset application data
    function resetData() {
        try {
            localStorage.removeItem(DATA_KEY);
            localStorage.removeItem(SESSION_KEY);
            return true;
        } catch (error) {
            console.error("Error resetting HCM data:", error);
            return false;
        }
    }

    // Public methods
    return {
        getDefaultData,
        getData,
        saveData,
        updateData,
        isSetupComplete,
        getSession,
        saveSession,
        clearSession,
        createId,
        resetData
    };
})();
 
})();