/**
 * Auth.js - Authentication and Authorization Module
 * Handles user login, logout, session management, and role-based access control
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        this.sessionTimer = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        // User roles and permissions
        this.roles = {
            'admin': {
                name: 'Administrator',
                permissions: ['*'], // All permissions
                level: 100
            },
            'approval_manager1': {
                name: 'Approval Manager 1',
                permissions: ['view_all', 'approve_department', 'manage_department'],
                level: 80
            },
            'approval_manager2': {
                name: 'Approval Manager 2',
                permissions: ['view_all', 'approve_division', 'manage_division'],
                level: 85
            },
            'hr_manager1': {
                name: 'HR Manager 1',
                permissions: ['view_all', 'manage_hr', 'view_reports'],
                level: 70
            },
            'hr_manager2': {
                name: 'HR Manager 2',
                permissions: ['view_all', 'manage_hr', 'view_reports', 'approve_hr'],
                level: 75
            },
            'individual_user': {
                name: 'Individual User',
                permissions: ['view_own', 'edit_own'],
                level: 10
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize authentication module
     */
    init() {
        this.checkExistingSession();
        this.setupEventListeners();
    }
    
    /**
     * Check for existing valid session
     */
    checkExistingSession() {
        try {
            const userData = localStorage.getItem('pms_current_user');
            const sessionData = localStorage.getItem('pms_session');
            
            if (userData && sessionData) {
                const user = JSON.parse(userData);
                const session = JSON.parse(sessionData);
                
                // Check if session is still valid
                if (Date.now() - session.timestamp < this.sessionTimeout) {
                    this.currentUser = user;
                    this.startSessionTimer();
                    return true;
                }
            }
        } catch (error) {
            console.error('Error checking existing session:', error);
        }
        
        this.clearSession();
        return false;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseSession();
            } else {
                this.resumeSession();
            }
        });
        
        // Handle user activity for session extension
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.extendSession(), { passive: true });
        });
        
        // Handle beforeunload to save session state
        window.addEventListener('beforeunload', () => {
            this.saveSessionState();
        });
    }
    
    /**
     * Authenticate user with employee code
     */
    async login(employeeCode) {
        try {
            // Check if account is locked
            if (this.isAccountLocked()) {
                throw new Error('Account temporarily locked due to multiple failed attempts. Please try again later.');
            }
            
            // Validate employee code format
            if (!this.validateEmployeeCode(employeeCode)) {
                throw new Error('Invalid employee code format');
            }
            
            // Show loading state
            this.setLoginLoading(true);
            
            // Attempt authentication through DataHandler
            const response = await window.DataHandler.authenticateUser(employeeCode);
            
            if (response.success) {
                this.handleLoginSuccess(response.user, response.offline);
                this.resetLoginAttempts();
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Authentication failed');
            }
            
        } catch (error) {
            this.handleLoginFailure(error.message);
            throw error;
        } finally {
            this.setLoginLoading(false);
        }
    }
    
    /**
     * Handle successful login
     */
    handleLoginSuccess(user, offline = false) {
        // Set current user
        this.currentUser = user;
        
        // Store user data
        localStorage.setItem('pms_current_user', JSON.stringify(user));
        
        // Create session
        const sessionData = {
            timestamp: Date.now(),
            empCode: user.emp_code,
            offline: offline
        };
        localStorage.setItem('pms_session', JSON.stringify(sessionData));
        
        // Start session timer
        this.startSessionTimer();
        
        // Log successful login
        this.logActivity('login', { empCode: user.emp_code, offline });
        
        // Show success message
        if (offline) {
            this.showNotification('Logged in offline mode', 'warning');
        } else {
            this.showNotification('Login successful', 'success');
        }
        
        // Apply user role styling
        this.applyRoleBasedUI();
        
        console.log('Login successful:', user);
    }
    
    /**
     * Handle login failure
     */
    handleLoginFailure(errorMessage) {
        this.loginAttempts++;
        
        const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
        
        if (remainingAttempts <= 0) {
            this.lockAccount();
            this.showNotification('Account locked due to multiple failed attempts', 'error');
        } else {
            this.showNotification(`${errorMessage}. ${remainingAttempts} attempts remaining.`, 'error');
        }
        
        // Log failed attempt
        this.logActivity('login_failed', { attempts: this.loginAttempts });
    }
    
    /**
     * Logout user
     */
    logout() {
        try {
            // Log activity
            this.logActivity('logout', { empCode: this.currentUser?.emp_code });
            
            // Clear session timer
            this.clearSessionTimer();
            
            // Clear user data
            this.clearSession();
            
            // Clear DataHandler authentication
            window.DataHandler.logout();
            
            // Show logout message
            this.showNotification('Logged out successfully', 'info');
            
            // Redirect to login
            this.redirectToLogin();
            
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null && this.isSessionValid();
    }
    
    /**
     * Check if session is valid
     */
    isSessionValid() {
        try {
            const sessionData = localStorage.getItem('pms_session');
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            return Date.now() - session.timestamp < this.sessionTimeout;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Get current user role
     */
    getCurrentUserRole() {
        return this.currentUser?.user_type || 'individual_user';
    }
    
    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userRole = this.getCurrentUserRole();
        const roleConfig = this.roles[userRole];
        
        if (!roleConfig) return false;
        
        // Admin has all permissions
        if (roleConfig.permissions.includes('*')) return true;
        
        return roleConfig.permissions.includes(permission);
    }
    
    /**
     * Check if user can access specific resource
     */
    canAccess(resource, empCode = null) {
        if (!this.isAuthenticated()) return false;
        
        const userRole = this.getCurrentUserRole();
        const currentEmpCode = this.currentUser.emp_code;
        
        switch (resource) {
            case 'own_data':
                return empCode === currentEmpCode || this.hasPermission('view_all');
                
            case 'system_config':
                return this.hasPermission('*');
                
            case 'user_roles':
                return this.hasPermission('*');
                
            case 'all_reports':
                return this.hasPermission('view_all') || this.hasPermission('view_reports');
                
            case 'department_data':
                return this.hasPermission('manage_department') || this.hasPermission('view_all');
                
            case 'division_data':
                return this.hasPermission('manage_division') || this.hasPermission('view_all');
                
            default:
                return false;
        }
    }
    
    /**
     * Apply role-based UI modifications
     */
    applyRoleBasedUI() {
        const userRole = this.getCurrentUserRole();
        const body = document.body;
        
        // Remove existing role classes
        body.classList.remove('admin', 'manager', 'hr', 'user');
        
        // Add role-specific class
        switch (userRole) {
            case 'admin':
                body.classList.add('admin');
                break;
            case 'approval_manager1':
            case 'approval_manager2':
                body.classList.add('manager');
                break;
            case 'hr_manager1':
            case 'hr_manager2':
                body.classList.add('hr');
                break;
            default:
                body.classList.add('user');
        }
        
        // Hide/show elements based on permissions
        this.updateUIElements();
    }
    
    /**
     * Update UI elements based on permissions
     */
    updateUIElements() {
        // Admin-only elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = this.hasPermission('*') ? 'block' : 'none';
        });
        
        // Manager-only elements
        const managerElements = document.querySelectorAll('.manager-only');
        managerElements.forEach(element => {
            element.style.display = this.hasPermission('view_all') ? 'block' : 'none';
        });
        
        // HR-only elements
        const hrElements = document.querySelectorAll('.hr-only');
        hrElements.forEach(element => {
            element.style.display = this.hasPermission('manage_hr') ? 'block' : 'none';
        });
    }
    
    /**
     * Session management methods
     */
    
    startSessionTimer() {
        this.clearSessionTimer();
        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);
    }
    
    clearSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }
    
    extendSession() {
        if (this.isAuthenticated()) {
            const sessionData = JSON.parse(localStorage.getItem('pms_session'));
            sessionData.timestamp = Date.now();
            localStorage.setItem('pms_session', JSON.stringify(sessionData));
            this.startSessionTimer();
        }
    }
    
    pauseSession() {
        this.clearSessionTimer();
    }
    
    resumeSession() {
        if (this.isAuthenticated()) {
            this.startSessionTimer();
        }
    }
    
    handleSessionTimeout() {
        this.showNotification('Session expired. Please login again.', 'warning');
        this.logout();
    }
    
    saveSessionState() {
        if (this.currentUser) {
            const sessionData = JSON.parse(localStorage.getItem('pms_session'));
            sessionData.lastActivity = Date.now();
            localStorage.setItem('pms_session', JSON.stringify(sessionData));
        }
    }
    
    /**
     * Account security methods
     */
    
    isAccountLocked() {
        const lockData = localStorage.getItem('pms_account_lock');
        if (!lockData) return false;
        
        try {
            const lock = JSON.parse(lockData);
            return Date.now() - lock.timestamp < this.lockoutDuration;
        } catch (error) {
            return false;
        }
    }
    
    lockAccount() {
        const lockData = {
            timestamp: Date.now(),
            attempts: this.loginAttempts
        };
        localStorage.setItem('pms_account_lock', JSON.stringify(lockData));
    }
    
    resetLoginAttempts() {
        this.loginAttempts = 0;
        localStorage.removeItem('pms_account_lock');
    }
    
    /**
     * Validation methods
     */
    
    validateEmployeeCode(empCode) {
        // Basic validation - can be customized based on company format
        if (!empCode || typeof empCode !== 'string') return false;
        
        // Remove whitespace
        empCode = empCode.trim();
        
        // Check length (assuming 4-10 characters)
        if (empCode.length < 4 || empCode.length > 10) return false;
        
        // Check format (alphanumeric)
        const pattern = /^[a-zA-Z0-9]+$/;
        return pattern.test(empCode);
    }
    
    /**
     * UI helper methods
     */
    
    setLoginLoading(loading) {
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        const loginForm = document.querySelector('#login-form');
        
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.textContent = loading ? 'Logging in...' : 'Login';
        }
        
        if (loginForm) {
            loginForm.classList.toggle('loading', loading);
        }
    }
    
    showLoginError(message) {
        const errorElement = document.querySelector('#login-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    clearLoginError() {
        const errorElement = document.querySelector('#login-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    redirectToLogin() {
        // Hide main dashboard
        const dashboard = document.querySelector('#main-dashboard');
        const loginSection = document.querySelector('#login-section');
        
        if (dashboard) dashboard.classList.add('hidden');
        if (loginSection) loginSection.classList.remove('hidden');
        
        // Clear form
        const loginForm = document.querySelector('#login-form');
        if (loginForm) loginForm.reset();
        
        // Focus on employee code input
        const empCodeInput = document.querySelector('#employee-code');
        if (empCodeInput) {
            setTimeout(() => empCodeInput.focus(), 100);
        }
    }
    
    redirectToDashboard() {
        const dashboard = document.querySelector('#main-dashboard');
        const loginSection = document.querySelector('#login-section');
        
        if (dashboard) dashboard.classList.remove('hidden');
        if (loginSection) loginSection.classList.add('hidden');
    }
    
    /**
     * Activity logging
     */
    
    logActivity(action, details = {}) {
        const logEntry = {
            timestamp: Date.now(),
            action: action,
            empCode: this.currentUser?.emp_code || 'unknown',
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store in local storage (in production, send to server)
        const logs = JSON.parse(localStorage.getItem('pms_activity_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 entries
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('pms_activity_logs', JSON.stringify(logs));
        
        console.log('Activity logged:', logEntry);
    }
    
    getActivityLogs() {
        return JSON.parse(localStorage.getItem('pms_activity_logs') || '[]');
    }
    
    /**
     * Utility methods
     */
    
    clearSession() {
        this.currentUser = null;
        localStorage.removeItem('pms_current_user');
        localStorage.removeItem('pms_session');
        
        // Remove role classes
        document.body.classList.remove('admin', 'manager', 'hr', 'user');
    }
    
    showNotification(message, type = 'info') {
        if (window.App && window.App.showNotification) {
            window.App.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * Password-less authentication helpers (for future enhancement)
     */
    
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    async sendOTP(empCode, contactMethod) {
        // This would integrate with SMS/Email service
        console.log(`OTP sent to ${contactMethod} for ${empCode}`);
        return true;
    }
    
    /**
     * Biometric authentication (for future enhancement)
     */
    
    async authenticateWithBiometric() {
        if ('credentials' in navigator) {
            try {
                const credential = await navigator.credentials.create({
                    publicKey: {
                        challenge: new Uint8Array(32),
                        rp: { name: "Performance Management System" },
                        user: {
                            id: new TextEncoder().encode(this.currentUser?.emp_code || 'user'),
                            name: this.currentUser?.emp_code || 'user',
                            displayName: this.currentUser?.name || 'User'
                        },
                        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                        authenticatorSelection: {
                            authenticatorAttachment: "platform"
                        }
                    }
                });
                
                return credential;
            } catch (error) {
                console.error('Biometric authentication failed:', error);
                return null;
            }
        }
        return null;
    }
    
    /**
     * Multi-factor authentication setup
     */
    
    setupMFA() {
        // Implementation for MFA setup
        console.log('MFA setup initiated');
    }
    
    verifyMFA(code) {
        // Implementation for MFA verification
        console.log('MFA verification:', code);
        return true;
    }
}

// Initialize global instance
window.AuthManager = new AuthManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}