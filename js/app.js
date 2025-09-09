/**
 * app.js - Main Application Controller
 * Orchestrates all modules and manages the overall application flow
 */

class PerformanceManagementApp {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'employee-profile';
        this.isInitialized = false;
        this.modules = {};
        
        // Application state
        this.state = {
            isLoading: false,
            isOffline: !navigator.onLine,
            theme: localStorage.getItem('pms_theme') || 'light',
            notifications: [],
            modals: []
        };
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoadingScreen();
            
            // Initialize modules
            await this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check for existing session
            await this.checkExistingSession();
            
            // Apply saved theme
            this.applyTheme(this.state.theme);
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('Performance Management System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    /**
     * Initialize all modules
     */
    async initializeModules() {
        try {
            // Wait for modules to be available
            await this.waitForModules();
            
            // Store module references
            this.modules = {
                dataHandler: window.DataHandler,
                auth: window.AuthManager,
                kraKpi: window.KRAKPIManager,
                achievement: window.ActualAchievementManager,
                competency: window.BehaviouralCompetencyManager,
                userRoles: window.UserRolesManager,
                systemConfig: window.SystemConfigManager
            };
            
            console.log('All modules initialized successfully');
            
        } catch (error) {
            throw new Error('Failed to initialize modules: ' + error.message);
        }
    }
    
    /**
     * Wait for all modules to be loaded
     */
    async waitForModules() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.DataHandler && 
                window.AuthManager && 
                window.KRAKPIManager && 
                window.ActualAchievementManager && 
                window.BehaviouralCompetencyManager && 
                window.UserRolesManager && 
                window.SystemConfigManager) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Modules failed to load within timeout');
    }
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Login form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                this.handleLogin();
            }
        });
        
        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn') {
                this.handleLogout();
            }
        });
        
        // Navigation tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-tab')) {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            }
        });
        
        // Online/offline status
        window.addEventListener('online', () => {
            this.state.isOffline = false;
            this.updateOnlineStatus();
            this.showNotification('Back online - syncing data...', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.state.isOffline = true;
            this.updateOnlineStatus();
            this.showNotification('You are offline - working in offline mode', 'warning');
        });
        
        // Theme changes
        document.addEventListener('theme-changed', (e) => {
            this.applyTheme(e.detail.theme);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Modal management
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-container')) {
                this.closeModal(e.target);
            }
        });
        
        // Notification management
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                this.closeNotification(e.target.closest('.notification'));
            }
        });
        
        // Auto-save prevention on page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
        
        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification('An unexpected error occurred', 'error');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showNotification('An unexpected error occurred', 'error');
        });
    }
    
    /**
     * Check for existing user session
     */
    async checkExistingSession() {
        if (this.modules.auth.isAuthenticated()) {
            this.currentUser = this.modules.auth.getCurrentUser();
            this.showDashboard();
            this.loadUserProfile();
        } else {
            this.showLogin();
        }
    }
    
    /**
     * Handle user login
     */
    async handleLogin() {
        const employeeCode = document.getElementById('employee-code')?.value.trim();
        
        if (!employeeCode) {
            this.showNotification('Please enter your employee code', 'error');
            return;
        }
        
        try {
            this.setLoadingState(true);
            this.clearLoginError();
            
            const result = await this.modules.auth.login(employeeCode);
            
            if (result.success) {
                this.currentUser = result.user;
                this.showDashboard();
                await this.loadUserProfile();
                
                if (result.offline) {
                    this.showNotification('Logged in offline mode', 'warning');
                }
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Handle user logout
     */
    handleLogout() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('You have unsaved changes. Are you sure you want to logout?')) {
                return;
            }
        }
        
        this.modules.auth.logout();
        this.currentUser = null;
        this.showLogin();
        this.clearUserData();
    }
    
    /**
     * Show login screen
     */
    showLogin() {
        document.getElementById('loading-screen')?.classList.add('hidden');
        document.getElementById('main-dashboard')?.classList.add('hidden');
        document.getElementById('login-section')?.classList.remove('hidden');
        
        // Focus on employee code input
        setTimeout(() => {
            document.getElementById('employee-code')?.focus();
        }, 100);
    }
    
    /**
     * Show main dashboard
     */
    showDashboard() {
        document.getElementById('loading-screen')?.classList.add('hidden');
        document.getElementById('login-section')?.classList.add('hidden');
        document.getElementById('main-dashboard')?.classList.remove('hidden');
        
        // Set active tab
        this.switchTab(this.currentTab);
    }
    
    /**
     * Load user profile data
     */
    async loadUserProfile() {
        if (!this.currentUser) return;
        
        try {
            // Update user info in header
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-role').textContent = this.modules.auth.roles[this.currentUser.user_type]?.name || this.currentUser.user_type;
            
            // Populate profile details
            document.getElementById('profile-emp-code').textContent = this.currentUser.emp_code;
            document.getElementById('profile-name').textContent = this.currentUser.name;
            document.getElementById('profile-division').textContent = this.currentUser.division;
            document.getElementById('profile-designation').textContent = this.currentUser.designation || 'Not specified';
            document.getElementById('profile-location').textContent = this.currentUser.location;
            document.getElementById('profile-department').textContent = this.currentUser.department;
            
            // Load performance summary
            await this.loadPerformanceSummary();
            
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }
    
    /**
     * Load performance summary
     */
    async loadPerformanceSummary() {
        try {
            const summary = await this.modules.dataHandler.getPerformanceSummary(this.currentUser.emp_code);
            
            // Update goals progress
            const goalsProgressElement = document.getElementById('goals-progress');
            if (goalsProgressElement) {
                const progressValue = goalsProgressElement.querySelector('.progress-value');
                if (progressValue) {
                    progressValue.textContent = `${summary.goalsProgress}%`;
                }
                
                // Update progress circle
                const progressPercentage = Math.min(summary.goalsProgress, 100);
                goalsProgressElement.style.background = `conic-gradient(var(--primary-color) ${progressPercentage}%, var(--border-light) ${progressPercentage}%)`;
            }
            
            // Update behavioural rating stars
            const ratingStars = document.getElementById('behavioural-rating');
            if (ratingStars) {
                const stars = ratingStars.querySelectorAll('.star');
                const filledStars = Math.round(summary.competencyAverage);
                stars.forEach((star, index) => {
                    star.classList.toggle('filled', index < filledStars);
                });
            }
            
            // Update overall medal
            const overallMedal = document.getElementById('overall-medal');
            if (overallMedal) {
                const medalIcon = overallMedal.querySelector('.medal-icon');
                const medalText = overallMedal.querySelector('.medal-text');
                
                if (summary.overallRating >= 90) {
                    medalIcon.classList.add('gold');
                    medalText.textContent = 'Outstanding';
                } else if (summary.overallRating >= 80) {
                    medalIcon.classList.add('good');
                    medalText.textContent = 'Exceeds Expectations';
                } else if (summary.overallRating >= 70) {
                    medalIcon.classList.add('satisfactory');
                    medalText.textContent = 'Meets Expectations';
                } else if (summary.overallRating > 0) {
                    medalText.textContent = 'In Progress';
                } else {
                    medalText.textContent = 'Pending';
                }
            }
            
        } catch (error) {
            console.error('Error loading performance summary:', error);
        }
    }
    
    /**
     * Switch between tabs
     */
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId)?.classList.add('active');
        
        // Store current tab
        this.currentTab = tabId;
        
        // Dispatch tab activation event
        document.dispatchEvent(new CustomEvent('tab-activated', {
            detail: { tabId }
        }));
        
        // Update URL hash
        window.location.hash = tabId;
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen() {
        document.getElementById('loading-screen')?.classList.remove('hidden');
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        document.getElementById('loading-screen')?.classList.add('hidden');
    }
    
    /**
     * Set loading state for forms
     */
    setLoadingState(loading) {
        this.state.isLoading = loading;
        
        // Update UI elements
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.textContent = loading ? 'Logging in...' : 'Login';
        }
    }
    
    /**
     * Show login error
     */
    showLoginError(message) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    /**
     * Clear login error
     */
    clearLoginError() {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <button class="notification-close">×</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.closeNotification(notification);
            }, duration);
        }
        
        // Store in state
        this.state.notifications.push(notification);
    }
    
    /**
     * Close notification
     */
    closeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'notificationSlideOut 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
                this.state.notifications = this.state.notifications.filter(n => n !== notification);
            }, 300);
        }
    }
    
    /**
     * Show modal
     */
    showModal(content, options = {}) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        if (options.large) modal.classList.add('modal-large');
        if (options.fullwidth) modal.classList.add('modal-fullwidth');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${options.title || 'Modal'}</h3>
                <button type="button" class="modal-close">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
        `;
        
        modalContainer.appendChild(modal);
        modalContainer.classList.remove('hidden');
        
        // Bind close events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modalContainer);
        });
        
        this.state.modals.push(modal);
        return modal;
    }
    
    /**
     * Close modal
     */
    closeModal(modalContainer) {
        if (modalContainer) {
            modalContainer.classList.add('hidden');
            modalContainer.innerHTML = '';
            this.state.modals = [];
        }
    }
    
    /**
     * Apply theme
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pms_theme', theme);
        this.state.theme = theme;
    }
    
    /**
     * Update online status
     */
    updateOnlineStatus() {
        document.body.classList.toggle('offline', this.state.isOffline);
        
        // Update status indicators
        const statusIndicators = document.querySelectorAll('.connection-status');
        statusIndicators.forEach(indicator => {
            indicator.textContent = this.state.isOffline ? 'Offline' : 'Online';
            indicator.className = `connection-status ${this.state.isOffline ? 'offline' : 'online'}`;
        });
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S - Save current form
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentForm();
        }
        
        // Ctrl/Cmd + L - Focus login field
        if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !this.modules.auth.isAuthenticated()) {
            e.preventDefault();
            document.getElementById('employee-code')?.focus();
        }
        
        // Escape - Close modals/notifications
        if (e.key === 'Escape') {
            // Close topmost modal
            if (this.state.modals.length > 0) {
                this.closeModal(document.getElementById('modal-container'));
            }
            
            // Close all notifications
            this.state.notifications.forEach(notification => {
                this.closeNotification(notification);
            });
        }
        
        // Tab navigation shortcuts (Alt + 1-6)
        if (e.altKey && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const tabs = ['employee-profile', 'kra-kpi-setting', 'actual-achievement', 'behavioural-competency', 'system-config', 'user-roles'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabs[tabIndex]) {
                this.switchTab(tabs[tabIndex]);
            }
        }
    }
    
    /**
     * Save current form
     */
    saveCurrentForm() {
        const currentTabContent = document.querySelector('.tab-content.active');
        const form = currentTabContent?.querySelector('form');
        
        if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
        }
    }
    
    /**
     * Check for unsaved changes
     */
    hasUnsavedChanges() {
        // This would check if any forms have unsaved changes
        // For now, return false
        return false;
    }
    
    /**
     * Clear user data
     */
    clearUserData() {
        // Clear profile fields
        const profileFields = ['profile-emp-code', 'profile-name', 'profile-division', 'profile-designation', 'profile-location', 'profile-department'];
        profileFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) element.textContent = '';
        });
        
        // Reset performance summary
        const progressValue = document.querySelector('#goals-progress .progress-value');
        if (progressValue) progressValue.textContent = '0%';
        
        const stars = document.querySelectorAll('#behavioural-rating .star');
        stars.forEach(star => star.classList.remove('filled'));
        
        const medalText = document.querySelector('#overall-medal .medal-text');
        if (medalText) medalText.textContent = 'Pending';
        
        const medalIcon = document.querySelector('#overall-medal .medal-icon');
        if (medalIcon) medalIcon.className = 'medal-icon';
    }
    
    /**
     * Export data
     */
    async exportData(type, format = 'csv') {
        try {
            switch (type) {
                case 'goals':
                    this.modules.kraKpi.exportGoals(format);
                    break;
                case 'achievements':
                    this.modules.achievement.exportAchievements(format);
                    break;
                case 'competencies':
                    this.modules.competency.exportCompetencies(format);
                    break;
                case 'users':
                    this.modules.userRoles.exportUsers(format);
                    break;
                default:
                    throw new Error('Unknown export type');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed: ' + error.message, 'error');
        }
    }
    
    /**
     * Print current view
     */
    print() {
        window.print();
    }
    
    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            authenticated: this.modules.auth?.isAuthenticated() || false,
            currentUser: this.currentUser,
            currentTab: this.currentTab,
            isOffline: this.state.isOffline,
            theme: this.state.theme,
            notifications: this.state.notifications.length,
            modals: this.state.modals.length
        };
    }
    
    /**
     * Debug information
     */
    debug() {
        console.group('Performance Management System Debug Info');
        console.log('Status:', this.getStatus());
        console.log('Modules:', this.modules);
        console.log('State:', this.state);
        console.groupEnd();
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        // Remove event listeners
        // Clear intervals/timeouts
        // Clean up resources
        console.log('Performance Management System destroyed');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.App = new PerformanceManagementApp();
    
    // Expose debug function globally
    window.debugPMS = () => window.App.debug();
    
    // Handle hash changes for direct tab navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash && document.getElementById(hash)) {
            window.App.switchTab(hash);
        }
    });
    
    // Check for initial hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash && document.getElementById(initialHash)) {
        window.App.currentTab = initialHash;
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('App hidden');
    } else {
        console.log('App visible');
        // Refresh data if needed
        if (window.App?.modules.auth?.isAuthenticated()) {
            window.App.loadPerformanceSummary();
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManagementApp;
}