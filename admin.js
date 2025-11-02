// --- DATABASE INITIALIZATION & UTILITIES ---
// This uses the SAME database key as the user app script.
const DB_NAME = 'earningAppDB';

function getAppDB() {
    let db = localStorage.getItem(DB_NAME);
    // If admin logs in first, DB might not exist.
    // We should rely on the user app to seed, but good to have a fallback.
    if (!db) {
        // A minimal structure if user app hasn't run
        const minData = {
            users: [], deposits: [], withdraws: [], plans: [],
            settings: { paymentMethods: {}, announcement: "" }
        };
        localStorage.setItem(DB_NAME, JSON.stringify(minData));
        return minData;
    }
    return JSON.parse(db);
}

function saveAppDB(db) {
    localStorage.setItem(DB_NAME, JSON.stringify(db));
}

// --- ADMIN AUTHENTICATION ---
function checkAdminAuth() {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    const onLoginPage = window.location.pathname.includes('login.html');

    if (!adminLoggedIn && !onLoginPage) {
        window.location.href = 'login.html';
    } else if (adminLoggedIn && onLoginPage) {
        window.location.href = 'dashboard.html';
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    // Get custom password or use default
    const adminPass = localStorage.getItem('adminPassword') || '12345';

    if (username === 'admin' && password === adminPass) {
        localStorage.setItem('adminLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        errorEl.textContent = 'Invalid username or password.';
    }
}

function handleAdminLogout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'login.html';
}

// --- SHARED UI (Sidebar) ---
function loadSidebar() {
    const sidebarEl = document.getElementById('admin-sidebar');
    if (!sidebarEl) return;

    const path = window.location.pathname;

    sidebarEl.innerHTML = `
        <div class="sidebar-header">
            <h2>Admin Panel</h2>
        </div>
        <ul class="sidebar-nav">
            <li>
                <a href="dashboard.html" class="${path.includes('dashboard') ? 'active' : ''}">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
            </li>
            <li>
                <a href="users.html" class="${path.includes('users') ? 'active' : ''}">
                    <i class="fas fa-users"></i> Manage Users
                </a>
            </li>
            <li>
                <a href="deposits.html" class="${path.includes('deposits') ? 'active' : ''}">
                    <i class="fas fa-wallet"></i> Manage Deposits
                </a>
            </li>
            <li>
                <a href="withdraws.html" class="${path.includes('withdraws') ? 'active' : ''}">
                    <i class="fas fa-money-bill-wave"></i> Manage Withdrawals
                </a>
            </li>
            <li>
                <a href="plans.html" class="${path.includes('plans') ? 'active' : ''}">
                    <i class="fas fa-box-open"></i> Manage Plans
                </a>
            </li>
            <li>
                <a href="settings.html" class="${path.includes('settings') ? 'active' : ''}">
                    <i class="fas fa-cogs"></i> Settings
                </a>
            </li>
            <li>
                <a href="#" id="admin-logout-btn" class="logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </li>
        </ul>
    `;
    
    // Add logout functionality
    document.getElementById('admin-logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleAdminLogout();
    });
}

// --- PAGE-SPECIFIC LOGIC ---

// Dashboard (dashboard.html)
function loadDashboardPage() {
    const db = getAppDB();

    // Total Users
    document.getElementById('stat-total-users').textContent = db.users.length;

    // Total Deposits
    const approvedDeposits = db.deposits.filter(d => d.status === 'Approved');
    const totalDepositAmount = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);
    document.getElementById('stat-total-deposits').textContent = `৳${totalDepositAmount.toFixed(2)}`;

    // Total Withdraws
    const approvedWithdraws = db.withdraws.filter(w => w.status === 'Approved');
    const totalWithdrawAmount = approvedWithdraws.reduce((sum, w) => sum + w.amount, 0);
    document.getElementById('stat-total-withdraws').textContent = `৳${totalWithdrawAmount.toFixed(2)}`;

    // Pending Deposits
    const pendingDeposits = db.deposits.filter(d => d.status === 'Pending');
    document.getElementById('stat-pending-deposits').textContent = pendingDeposits.length;

    // Pending Withdrawals
    const pendingWithdraws = db.withdraws.filter(w => w.status === 'Pending');
    document.getElementById('stat-pending-withdraws').textContent = pendingWithdraws.length;

    // Active Plans
    const activePlans = db.users.filter(u => u.plan && u.plan !== 'None').length;
    document.getElementById('stat-active-plans').textContent = activePlans;
}

// Manage Users (users.html)
function loadUsersPage() {
    const db = getAppDB();
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';

    db.users.forEach(user => {
        tableBody.innerHTML += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.phone}</td>
                <td>${user.balance.toFixed(2)}</td>
                <td>${user.plan}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="openUserModal(${user.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i> Delete</button>
                </td>
            </tr>
        `;
    });

    // Modal Listeners
    document.getElementById('close-user-modal').addEventListener('click', () => {
        document.getElementById('edit-user-modal').style.display = 'none';
    });
    document.getElementById('edit-user-form').addEventListener('submit', saveUser);
}

function openUserModal(userId) {
    const db = getAppDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-phone').value = user.phone;
    document.getElementById('edit-user-balance').value = user.balance;
    document.getElementById('edit-user-plan').value = user.plan;

    document.getElementById('edit-user-modal').style.display = 'flex';
}

function saveUser(event) {
    event.preventDefault();
    const userId = parseInt(document.getElementById('edit-user-id').value);
    const db = getAppDB();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        alert("Error: User not found!");
        return;
    }

    db.users[userIndex].name = document.getElementById('edit-user-name').value;
    db.users[userIndex].phone = document.getElementById('edit-user-phone').value;
    db.users[userIndex].balance = parseFloat(document.getElementById('edit-user-balance').value);
    db.users[userIndex].plan = document.getElementById('edit-user-plan').value;

    saveAppDB(db);
    alert("User updated successfully!");
    document.getElementById('edit-user-modal').style.display = 'none';
    loadUsersPage(); // Refresh table
}

function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user? This action is irreversible.")) {
        return;
    }

    const db = getAppDB();
    db.users = db.users.filter(u => u.id !== userId);
    
    saveAppDB(db);
    alert("User deleted successfully.");
    loadUsersPage(); // Refresh table
}


// Manage Deposits (deposits.html)
function loadDepositsPage() {
    const db = getAppDB();
    const pendingTable = document.getElementById('pending-deposits-table');
    const completedTable = document.getElementById('completed-deposits-table');

    pendingTable.innerHTML = '';
    completedTable.innerHTML = '';

    const pending = db.deposits.filter(d => d.status === 'Pending').reverse();
    const completed = db.deposits.filter(d => d.status !== 'Pending').reverse().slice(0, 20);

    pending.forEach(d => {
        pendingTable.innerHTML += `
            <tr>
                <td>${new Date(d.date).toLocaleString()}</td>
                <td>${d.userPhone}</td>
                <td>${d.amount.toFixed(2)}</td>
                <td>${d.method}</td>
                <td>${d.trxId || 'N/A'}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-success" onclick="approveDeposit(${d.id})"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectDeposit(${d.id})"><i class="fas fa-times"></i> Reject</button>
                </td>
            </tr>
        `;
    });

    completed.forEach(d => {
        completedTable.innerHTML += `
            <tr>
                <td>${new Date(d.date).toLocaleString()}</td>
                <td>${d.userPhone}</td>
                <td>${d.amount.toFixed(2)}</td>
                <td>${d.method}</td>
                <td><span class="status status-${d.status.toLowerCase()}">${d.status}</span></td>
            </tr>
        `;
    });
}

function approveDeposit(depositId) {
    const db = getAppDB();
    const deposit = db.deposits.find(d => d.id === depositId);
    if (!deposit) return;

    const user = db.users.find(u => u.phone === deposit.userPhone);
    if (!user) {
        alert("Error: User for this deposit not found!");
        return;
    }

    // Update deposit status
    deposit.status = 'Approved';
    
    // Update user balance
    user.balance += deposit.amount;
    user.totalDeposit += deposit.amount;

    saveAppDB(db);
    loadDepositsPage(); // Refresh
}

function rejectDeposit(depositId) {
    const db = getAppDB();
    const deposit = db.deposits.find(d => d.id === depositId);
    if (!deposit) return;

    deposit.status = 'Rejected';
    saveAppDB(db);
    loadDepositsPage(); // Refresh
}


// Manage Withdrawals (withdraws.html)
function loadWithdrawsPage() {
    const db = getAppDB();
    const pendingTable = document.getElementById('pending-withdraws-table');
    const completedTable = document.getElementById('completed-withdraws-table');

    pendingTable.innerHTML = '';
    completedTable.innerHTML = '';

    const pending = db.withdraws.filter(w => w.status === 'Pending').reverse();
    const completed = db.withdraws.filter(w => w.status !== 'Pending').reverse().slice(0, 20);

    pending.forEach(w => {
        pendingTable.innerHTML += `
            <tr>
                <td>${new Date(w.date).toLocaleString()}</td>
                <td>${w.userPhone}</td>
                <td>${w.amount.toFixed(2)}</td>
                <td>${w.method}</td>
                <td>${w.wallet}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-success" onclick="approveWithdraw(${w.id})"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectWithdraw(${w.id})"><i class="fas fa-times"></i> Reject</button>
                </td>
            </tr>
        `;
    });

    completed.forEach(w => {
        completedTable.innerHTML += `
            <tr>
                <td>${new Date(w.date).toLocaleString()}</td>
                <td>${w.userPhone}</td>
                <td>${w.amount.toFixed(2)}</td>
                <td>${w.method}</td>
                <td><span class="status status-${w.status.toLowerCase()}">${w.status}</span></td>
            </tr>
        `;
    });
}

function approveWithdraw(withdrawId) {
    const db = getAppDB();
    const withdraw = db.withdraws.find(w => w.id === withdrawId);
    if (!withdraw) return;

    const user = db.users.find(u => u.phone === withdraw.userPhone);
    if (!user) {
        alert("Error: User for this withdrawal not found!");
        return;
    }
    
    // Check balance AGAIN before approving
    if (user.balance < withdraw.amount) {
        alert("Error: User's balance is insufficient. Rejecting.");
        rejectWithdraw(withdrawId);
        return;
    }

    // Update withdraw status
    withdraw.status = 'Approved';
    
    // Update user balance
    user.balance -= withdraw.amount;
    user.totalWithdraw += withdraw.amount;

    saveAppDB(db);
    loadWithdrawsPage(); // Refresh
}

function rejectWithdraw(withdrawId) {
    const db = getAppDB();
    const withdraw = db.withdraws.find(w => w.id === withdrawId);
    if (!withdraw) return;

    withdraw.status = 'Rejected';
    saveAppDB(db);
    loadWithdrawsPage(); // Refresh
}

// Manage Plans (plans.html)
function loadPlansPage() {
    const db = getAppDB();
    const tableBody = document.getElementById('plans-table-body');
    tableBody.innerHTML = '';

    db.plans.forEach(plan => {
        tableBody.innerHTML += `
            <tr>
                <td>${plan.id}</td>
                <td>${plan.name}</td>
                <td>${plan.price}</td>
                <td>${plan.reward}</td>
                <td>${plan.validity}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="openPlanModal(${plan.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePlan(${plan.id})"><i class="fas fa-trash"></i> Delete</button>
                </td>
            </tr>
        `;
    });

    // Modal Listeners
    document.getElementById('add-plan-btn').addEventListener('click', () => openPlanModal(null));
    document.getElementById('close-plan-modal').addEventListener('click', () => {
        document.getElementById('plan-modal').style.display = 'none';
    });
    document.getElementById('plan-form').addEventListener('submit', savePlan);
}

function openPlanModal(planId) {
    const form = document.getElementById('plan-form');
    form.reset();
    document.getElementById('plan-id').value = '';

    if (planId) {
        // Edit mode
        const db = getAppDB();
        const plan = db.plans.find(p => p.id === planId);
        if (!plan) return;

        document.getElementById('plan-modal-title').textContent = 'Edit Plan';
        document.getElementById('plan-id').value = plan.id;
        document.getElementById('plan-name').value = plan.name;
        document.getElementById('plan-price').value = plan.price;
        document.getElementById('plan-reward').value = plan.reward;
        document.getElementById('plan-validity').value = plan.validity;
    } else {
        // Add mode
        document.getElementById('plan-modal-title').textContent = 'Add New Plan';
    }
    document.getElementById('plan-modal').style.display = 'flex';
}

function savePlan(event) {
    event.preventDefault();
    const planId = document.getElementById('plan-id').value;
    const db = getAppDB();

    const planData = {
        name: document.getElementById('plan-name').value,
        price: parseFloat(document.getElementById('plan-price').value),
        reward: parseFloat(document.getElementById('plan-reward').value),
        validity: parseInt(document.getElementById('plan-validity').value),
    };

    if (planId) {
        // Update existing plan
        const planIndex = db.plans.findIndex(p => p.id === parseInt(planId));
        if (planIndex > -1) {
            db.plans[planIndex] = { ...db.plans[planIndex], ...planData };
        }
    } else {
        // Add new plan
        planData.id = db.plans.length > 0 ? Math.max(...db.plans.map(p => p.id)) + 1 : 1;
        db.plans.push(planData);
    }

    saveAppDB(db);
    alert("Plan saved successfully!");
    document.getElementById('plan-modal').style.display = 'none';
    loadPlansPage(); // Refresh table
}

function deletePlan(planId) {
    if (!confirm("Are you sure you want to delete this plan?")) {
        return;
    }
    const db = getAppDB();
    db.plans = db.plans.filter(p => p.id !== planId);
    saveAppDB(db);
    alert("Plan deleted successfully.");
    loadPlansPage(); // Refresh table
}

// Settings Page (settings.html)
function loadSettingsPage() {
    const db = getAppDB();

    // Load Announcement
    document.getElementById('announcement-text').value = db.settings.announcement || '';
    
    // Load Payment Methods
    const methods = db.settings.paymentMethods || {};
    document.getElementById('payment-bkash').value = methods.bkash || '';
    document.getElementById('payment-nagad').value = methods.nagad || '';
    document.getElementById('payment-usdt').value = methods.usdt || '';
    document.getElementById('payment-btc').value = methods.btc || '';
    
    // Bind forms
    document.getElementById('announcement-form').addEventListener('submit', saveAnnouncement);
    document.getElementById('payment-methods-form').addEventListener('submit', savePaymentMethods);
    document.getElementById('admin-password-form').addEventListener('submit', saveAdminPassword);

    // Data management
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('reset-data-btn').addEventListener('click', resetData);
}

function saveAnnouncement(e) {
    e.preventDefault();
    const db = getAppDB();
    db.settings.announcement = document.getElementById('announcement-text').value;
    saveAppDB(db);
    alert("Announcement updated!");
}

function savePaymentMethods(e) {
    e.preventDefault();
    const db = getAppDB();
    db.settings.paymentMethods = {
        bkash: document.getElementById('payment-bkash').value,
        nagad: document.getElementById('payment-nagad').value,
        usdt: document.getElementById('payment-usdt').value,
        btc: document.getElementById('payment-btc').value,
    };
    saveAppDB(db);
    alert("Payment methods updated!");
}

function saveAdminPassword(e) {
    e.preventDefault();
    const newPass = document.getElementById('new-admin-password').value;
    if (newPass.length < 4) {
        alert("Password must be at least 4 characters long.");
        return;
    }
    localStorage.setItem('adminPassword', newPass);
    alert("Admin password changed successfully!");
    document.getElementById('new-admin-password').value = '';
}

function exportData() {
    const db = getAppDB();
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'earningAppDB_backup.json';
    
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function resetData() {
    if (!confirm("DANGER! This will delete ALL users, transactions, and settings. Are you absolutely sure?")) {
        return;
    }
    if (prompt("To confirm, type 'DELETE ALL' in all caps.") !== 'DELETE ALL') {
        alert("Reset canceled.");
        return;
    }
    
    localStorage.removeItem(DB_NAME);
    // We can also remove admin pass and log out
    localStorage.removeItem('adminPassword');
    localStorage.removeItem('adminLoggedIn');
    alert("All data has been reset. You will be logged out.");
    window.location.href = 'login.html';
}


// --- ROUTER & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Check auth on all pages
    checkAdminAuth();

    const path = window.location.pathname;

    if (path.includes('login.html')) {
        document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    } else {
        // Load sidebar on all authenticated pages
        loadSidebar();
    }

    if (path.includes('dashboard.html')) {
        loadDashboardPage();
    }
    else if (path.includes('users.html')) {
        loadUsersPage();
    }
    else if (path.includes('deposits.html')) {
        loadDepositsPage();
    }
    else if (path.includes('withdraws.html')) {
        loadWithdrawsPage();
    }
    else if (path.includes('plans.html')) {
        loadPlansPage();
    }
    else if (path.includes('settings.html')) {
        loadSettingsPage();
    }
});