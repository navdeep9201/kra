/**
 * System_Config.js - System Configuration Management Module
 * Handles time window configuration, system settings, and administrative controls
 * Admin-only functionality
 */

class SystemConfigManager {
    constructor() {
        this.config = {
            timeWindows: {
                kraKpiWindow: {
                    name: 'KRA & KPI Setting Window',
                    description: 'Period when employees can set their SMART goals',
                    startMonth: 8, // August
                    endMonth: 9,   // September
                    active: false,
                    readOnly: false
                },
                midYearWindow: {
                    name: 'Mid-Year Review Window',
                    description: 'Period for mid-year progress review',
                    startMonth: 11, // November
                    endMonth: 12,   // December
                    active: false,
                    readOnly: false
                },
                yearEndWindow: {
                    name: 'Year-End Achievement Window',
                    description: 'Period for final achievement assessment',
                    startMonth: 12, // December
                    endMonth: 1,    // January (next year)
                    active: false,
                    readOnly: false
                },
                competencyWindow: {
                    name: 'Behavioural Competency Window',
                    description: 'Period for competency evaluation (Year-end only)',
                    startMonth: 12, // December
                    endMonth: 1,    // January (next year)
                    active: false,
                    readOnly: false
                }
            },
            systemSettings: {
                organizationName: 'Your Organization Name',
                financialYearStart: 4, // April
                maxGoalsPerEmployee: 5,
                minGoalsPerEmployee: 4,
                maxKPIsPerGoal: 3,
                minKPIsPerGoal: 2,
                minWeightagePerGoal: 4,
                competencyWeightage: 30, // 30% for behavioral, 70% for goals
                goalWeightage: 70,
                autoSaveInterval: 30, // seconds
                sessionTimeout: 480,  // minutes (8 hours)
                enableNotifications: true,
                enableAutoSave: true,
                enableOfflineMode: true,
                theme: 'light'
            },
            notifications: {
                kraKpiReminder: {
                    enabled: true,
                    daysBefore: 7,
                    message: 'KRA & KPI setting window will close in {days} days'
                },
                midYearReminder: {
                    enabled: true,
                    daysBefore: 5,
                    message: 'Mid-year review window will close in {days} days'
                },
                yearEndReminder: {
                    enabled: true,
                    daysBefore: 10,
                    message: 'Year-end evaluation window will close in {days} days'
                }
            }
        };
        
        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.themes = [
            { value: 'light', name: 'Light Theme' },
            { value: 'dark', name: 'Dark Theme' },
            { value: 'blue', name: 'Blue Theme' },
            { value: 'green', name: 'Green Theme' },
            { value: 'purple', name: 'Purple Theme' },
            { value: 'corporate', name: 'Corporate Theme' }
        ];
        
        this.init();
    }
    
    /**
     * Initialize System Config module
     */
    init() {
        this.bindEvents();
        this.checkPermissions();
        this.loadCurrentConfig();
    }
    
    /**
     * Check if current user has admin permissions
     */
    checkPermissions() {
        const currentUser = window.AuthManager.getCurrentUser();
        if (!currentUser || !window.AuthManager.hasPermission('*')) {
            this.showAccessDenied();
            return false;
        }
        return true;
    }
    
    /**
     * Show access denied message
     */
    showAccessDenied() {
        const contentDiv = document.querySelector('#config-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="access-denied">
                    <div class="access-denied-icon">🔧</div>
                    <h3>Access Denied</h3>
                    <p>You don't have permission to access system configuration.</p>
                    <p>This functionality is restricted to system administrators only.</p>
                </div>
            `;
        }
    }
    
    /**
     * Load current configuration
     */
    async loadCurrentConfig() {
        try {
            const savedConfig = await window.DataHandler.getSystemConfig?.() || 
                                JSON.parse(localStorage.getItem('pms_system_config') || '{}');
            
            // Merge with default config
            this.config = this.deepMerge(this.config, savedConfig);
            
        } catch (error) {
            console.log('Using default system configuration');
        }
    }
    
    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab activation
        document.addEventListener('tab-activated', (e) => {
            if (e.detail.tabId === 'system-config') {
                this.loadContent();
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'time-windows-form') {
                e.preventDefault();
                this.saveTimeWindows();
            } else if (e.target.id === 'system-settings-form') {
                e.preventDefault();
                this.saveSystemSettings();
            } else if (e.target.id === 'notifications-form') {
                e.preventDefault();
                this.saveNotificationSettings();
            }
        });
    }
    
    /**
     * Load system config content
     */
    async loadContent() {
        const contentDiv = document.querySelector('#config-content');
        if (!contentDiv) return;
        
        if (!this.checkPermissions()) {
            return;
        }
        
        try {
            // Show loading
            contentDiv.innerHTML = this.getLoadingHTML();
            
            // Load current config
            await this.loadCurrentConfig();
            
            // Render content
            contentDiv.innerHTML = this.getContentHTML();
            
            // Bind dynamic events
            this.bindDynamicEvents();
            
            // Populate forms
            this.populateForms();
            
            // Update current status
            this.updateCurrentStatus();
            
        } catch (error) {
            console.error('Error loading system config content:', error);
            contentDiv.innerHTML = this.getErrorHTML(error.message);
        }
    }
    
    /**
     * Get loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="text-center p-8">
                <div class="spinner mx-auto mb-4"></div>
                <p>Loading system configuration...</p>
            </div>
        `;
    }
    
    /**
     * Get error HTML
     */
    getErrorHTML(message) {
        return `
            <div class="alert alert-error">
                <h4>Error Loading System Configuration</h4>
                <p>${message}</p>
                <button class="btn btn-primary mt-4" onclick="window.SystemConfigManager.loadContent()">
                    Retry
                </button>
            </div>
        `;
    }
    
    /**
     * Get main content HTML
     */
    getContentHTML() {
        return `
            <div class="system-config-container">
                ${this.getSystemOverviewHTML()}
                ${this.getConfigTabsHTML()}
                ${this.getConfigContentHTML()}
            </div>
        `;
    }
    
    /**
     * Get system overview HTML
     */
    getSystemOverviewHTML() {
        return `
            <div class="system-overview">
                <div class="overview-header">
                    <h4>System Configuration Overview</h4>
                    <div class="system-status">
                        <div class="status-indicator active"></div>
                        <span>System Active</span>
                    </div>
                </div>
                
                <div class="overview-stats">
                    <div class="overview-stat">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number" id="active-windows">0</div>
                            <div class="stat-label">Active Windows</div>
                        </div>
                    </div>
                    <div class="overview-stat">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-number" id="total-users">0</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                    </div>
                    <div class="overview-stat">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-number" id="goals-completion">0%</div>
                            <div class="stat-label">Goals Completion</div>
                        </div>
                    </div>
                    <div class="overview-stat">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-number" id="evaluations-completion">0%</div>
                            <div class="stat-label">Evaluations Completion</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get config tabs HTML
     */
    getConfigTabsHTML() {
        return `
            <div class="config-tabs">
                <button class="config-tab active" data-tab="time-windows">
                    <span class="tab-icon">📅</span>
                    Time Windows
                </button>
                <button class="config-tab" data-tab="system-settings">
                    <span class="tab-icon">⚙️</span>
                    System Settings
                </button>
                <button class="config-tab" data-tab="notifications">
                    <span class="tab-icon">🔔</span>
                    Notifications
                </button>
                <button class="config-tab" data-tab="backup-restore">
                    <span class="tab-icon">💾</span>
                    Backup & Restore
                </button>
                <button class="config-tab" data-tab="audit-logs">
                    <span class="tab-icon">📋</span>
                    Audit Logs
                </button>
            </div>
        `;
    }
    
    /**
     * Get config content HTML
     */
    getConfigContentHTML() {
        return `
            <div class="config-content">
                ${this.getTimeWindowsHTML()}
                ${this.getSystemSettingsHTML()}
                ${this.getNotificationsHTML()}
                ${this.getBackupRestoreHTML()}
                ${this.getAuditLogsHTML()}
            </div>
        `;
    }
    
    /**
     * Get time windows configuration HTML
     */
    getTimeWindowsHTML() {
        return `
            <div id="time-windows-content" class="config-tab-content active">
                <div class="config-section">
                    <h5>Time Window Configuration</h5>
                    <p class="text-muted">Configure when different performance management activities are available to users.</p>
                    
                    <form id="time-windows-form" class="time-windows-form">
                        ${Object.entries(this.config.timeWindows).map(([key, window]) => `
                            <div class="window-config-card">
                                <div class="window-header">
                                    <h6>${window.name}</h6>
                                    <div class="window-controls">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="${key}-active" ${window.active ? 'checked' : ''}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <span class="toggle-label">Active</span>
                                    </div>
                                </div>
                                
                                <p class="window-description">${window.description}</p>
                                
                                <div class="window-settings">
                                    <div class="form-group">
                                        <label>Start Month</label>
                                        <select id="${key}-start-month" class="form-control">
                                            ${this.months.map((month, index) => `
                                                <option value="${index + 1}" ${window.startMonth === (index + 1) ? 'selected' : ''}>
                                                    ${month}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>End Month</label>
                                        <select id="${key}-end-month" class="form-control">
                                            ${this.months.map((month, index) => `
                                                <option value="${index + 1}" ${window.endMonth === (index + 1) ? 'selected' : ''}>
                                                    ${month}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <div class="checkbox">
                                            <input type="checkbox" id="${key}-readonly" ${window.readOnly ? 'checked' : ''}>
                                            <label for="${key}-readonly">Read Only Mode</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="window-status">
                                    <div class="status-indicator ${window.active ? 'active' : 'inactive'}"></div>
                                    <span class="status-text">
                                        ${window.active ? (window.readOnly ? 'Active (Read Only)' : 'Active') : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Time Windows</button>
                            <button type="button" id="reset-windows-btn" class="btn btn-secondary">Reset to Default</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    /**
     * Get system settings HTML
     */
    getSystemSettingsHTML() {
        return `
            <div id="system-settings-content" class="config-tab-content">
                <div class="config-section">
                    <h5>System Settings</h5>
                    <p class="text-muted">Configure general system parameters and behavior.</p>
                    
                    <form id="system-settings-form" class="system-settings-form">
                        <div class="settings-grid">
                            <div class="settings-group">
                                <h6>Organization Settings</h6>
                                <div class="form-group">
                                    <label for="org-name">Organization Name</label>
                                    <input type="text" id="org-name" class="form-control" 
                                           value="${this.config.systemSettings.organizationName}">
                                </div>
                                <div class="form-group">
                                    <label for="financial-year-start">Financial Year Start</label>
                                    <select id="financial-year-start" class="form-control">
                                        ${this.months.map((month, index) => `
                                            <option value="${index + 1}" ${this.config.systemSettings.financialYearStart === (index + 1) ? 'selected' : ''}>
                                                ${month}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="theme-select">Default Theme</label>
                                    <select id="theme-select" class="form-control">
                                        ${this.themes.map(theme => `
                                            <option value="${theme.value}" ${this.config.systemSettings.theme === theme.value ? 'selected' : ''}>
                                                ${theme.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div class="settings-group">
                                <h6>Goal Settings</h6>
                                <div class="form-group">
                                    <label for="max-goals">Maximum Goals per Employee</label>
                                    <input type="number" id="max-goals" class="form-control" min="3" max="10" 
                                           value="${this.config.systemSettings.maxGoalsPerEmployee}">
                                </div>
                                <div class="form-group">
                                    <label for="min-goals">Minimum Goals per Employee</label>
                                    <input type="number" id="min-goals" class="form-control" min="2" max="8" 
                                           value="${this.config.systemSettings.minGoalsPerEmployee}">
                                </div>
                                <div class="form-group">
                                    <label for="max-kpis">Maximum KPIs per Goal</label>
                                    <input type="number" id="max-kpis" class="form-control" min="2" max="5" 
                                           value="${this.config.systemSettings.maxKPIsPerGoal}">
                                </div>
                                <div class="form-group">
                                    <label for="min-kpis">Minimum KPIs per Goal</label>
                                    <input type="number" id="min-kpis" class="form-control" min="1" max="4" 
                                           value="${this.config.systemSettings.minKPIsPerGoal}">
                                </div>
                                <div class="form-group">
                                    <label for="min-weightage">Minimum Weightage per Goal (%)</label>
                                    <input type="number" id="min-weightage" class="form-control" min="1" max="20" 
                                           value="${this.config.systemSettings.minWeightagePerGoal}">
                                </div>
                            </div>
                            
                            <div class="settings-group">
                                <h6>Scoring Settings</h6>
                                <div class="form-group">
                                    <label for="goal-weightage">Goal Weightage (%)</label>
                                    <input type="number" id="goal-weightage" class="form-control" min="50" max="90" 
                                           value="${this.config.systemSettings.goalWeightage}">
                                </div>
                                <div class="form-group">
                                    <label for="competency-weightage">Competency Weightage (%)</label>
                                    <input type="number" id="competency-weightage" class="form-control" min="10" max="50" 
                                           value="${this.config.systemSettings.competencyWeightage}">
                                </div>
                                <div class="weightage-total">
                                    Total: <span id="total-weightage">100</span>%
                                </div>
                            </div>
                            
                            <div class="settings-group">
                                <h6>System Behavior</h6>
                                <div class="form-group">
                                    <label for="auto-save-interval">Auto-save Interval (seconds)</label>
                                    <input type="number" id="auto-save-interval" class="form-control" min="10" max="300" 
                                           value="${this.config.systemSettings.autoSaveInterval}">
                                </div>
                                <div class="form-group">
                                    <label for="session-timeout">Session Timeout (minutes)</label>
                                    <input type="number" id="session-timeout" class="form-control" min="60" max="1440" 
                                           value="${this.config.systemSettings.sessionTimeout}">
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <input type="checkbox" id="enable-notifications" ${this.config.systemSettings.enableNotifications ? 'checked' : ''}>
                                        <label for="enable-notifications">Enable System Notifications</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <input type="checkbox" id="enable-auto-save" ${this.config.systemSettings.enableAutoSave ? 'checked' : ''}>
                                        <label for="enable-auto-save">Enable Auto-save</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <input type="checkbox" id="enable-offline-mode" ${this.config.systemSettings.enableOfflineMode ? 'checked' : ''}>
                                        <label for="enable-offline-mode">Enable Offline Mode</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Settings</button>
                            <button type="button" id="reset-settings-btn" class="btn btn-secondary">Reset to Default</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    /**
     * Get notifications configuration HTML
     */
    getNotificationsHTML() {
        return `
            <div id="notifications-content" class="config-tab-content">
                <div class="config-section">
                    <h5>Notification Settings</h5>
                    <p class="text-muted">Configure system notifications and reminders.</p>
                    
                    <form id="notifications-form" class="notifications-form">
                        ${Object.entries(this.config.notifications).map(([key, notification]) => `
                            <div class="notification-config-card">
                                <div class="notification-header">
                                    <h6>${notification.message.split(' window')[0]} Reminder</h6>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="${key}-enabled" ${notification.enabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                
                                <div class="notification-settings">
                                    <div class="form-group">
                                        <label for="${key}-days-before">Days Before Window Closes</label>
                                        <input type="number" id="${key}-days-before" class="form-control" 
                                               min="1" max="30" value="${notification.daysBefore}">
                                    </div>
                                    <div class="form-group">
                                        <label for="${key}-message">Notification Message</label>
                                        <textarea id="${key}-message" class="form-control" rows="2"
                                                  placeholder="Use {days} placeholder for dynamic days">${notification.message}</textarea>
                                    </div>
                                </div>
                                
                                <div class="notification-preview">
                                    <strong>Preview:</strong>
                                    <span id="${key}-preview">${notification.message.replace('{days}', notification.daysBefore)}</span>
                                </div>
                            </div>
                        `).join('')}
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Notifications</button>
                            <button type="button" id="test-notifications-btn" class="btn btn-outline">Test Notifications</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    /**
     * Get backup and restore HTML
     */
    getBackupRestoreHTML() {
        return `
            <div id="backup-restore-content" class="config-tab-content">
                <div class="config-section">
                    <h5>Backup & Restore</h5>
                    <p class="text-muted">Manage system data backups and restoration.</p>
                    
                    <div class="backup-restore-grid">
                        <div class="backup-section">
                            <h6>Data Backup</h6>
                            <div class="backup-options">
                                <div class="checkbox">
                                    <input type="checkbox" id="backup-users" checked>
                                    <label for="backup-users">User Data</label>
                                </div>
                                <div class="checkbox">
                                    <input type="checkbox" id="backup-goals" checked>
                                    <label for="backup-goals">Goals & KPIs</label>
                                </div>
                                <div class="checkbox">
                                    <input type="checkbox" id="backup-competencies" checked>
                                    <label for="backup-competencies">Competency Evaluations</label>
                                </div>
                                <div class="checkbox">
                                    <input type="checkbox" id="backup-config" checked>
                                    <label for="backup-config">System Configuration</label>
                                </div>
                            </div>
                            <div class="backup-actions">
                                <button id="create-backup-btn" class="btn btn-primary">Create Backup</button>
                                <button id="schedule-backup-btn" class="btn btn-outline">Schedule Backup</button>
                            </div>
                        </div>
                        
                        <div class="restore-section">
                            <h6>Data Restore</h6>
                            <div class="restore-upload">
                                <input type="file" id="restore-file" accept=".json,.zip" class="form-control">
                                <button id="restore-data-btn" class="btn btn-warning">Restore Data</button>
                            </div>
                            <div class="restore-warning">
                                <p class="text-warning">⚠️ Warning: Restoring data will overwrite existing data. Create a backup first.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="backup-history">
                        <h6>Backup History</h6>
                        <div id="backup-history-list" class="backup-list">
                            <!-- Will be populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get audit logs HTML
     */
    getAuditLogsHTML() {
        return `
            <div id="audit-logs-content" class="config-tab-content">
                <div class="config-section">
                    <h5>Audit Logs</h5>
                    <p class="text-muted">View system activity and user actions.</p>
                    
                    <div class="logs-filters">
                        <div class="form-group">
                            <label for="log-date-from">From Date</label>
                            <input type="date" id="log-date-from" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="log-date-to">To Date</label>
                            <input type="date" id="log-date-to" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="log-user-filter">User</label>
                            <input type="text" id="log-user-filter" class="form-control" placeholder="Employee code">
                        </div>
                        <div class="form-group">
                            <label for="log-action-filter">Action</label>
                            <select id="log-action-filter" class="form-control">
                                <option value="">All Actions</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                                <option value="save_goals">Save Goals</option>
                                <option value="save_competencies">Save Competencies</option>
                                <option value="config_change">Config Change</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button id="filter-logs-btn" class="btn btn-primary">Filter Logs</button>
                            <button id="export-logs-btn" class="btn btn-outline">Export Logs</button>
                        </div>
                    </div>
                    
                    <div class="logs-table-container">
                        <table id="audit-logs-table" class="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody id="audit-logs-tbody">
                                <!-- Will be populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind dynamic events
     */
    bindDynamicEvents() {
        // Config tabs
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchConfigTab(tabName);
            });
        });
        
        // Time window controls
        document.querySelectorAll('[id$="-active"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateWindowStatus());
        });
        
        // Weightage calculation
        document.getElementById('goal-weightage')?.addEventListener('input', () => this.updateWeightageTotal());
        document.getElementById('competency-weightage')?.addEventListener('input', () => this.updateWeightageTotal());
        
        // Notification previews
        Object.keys(this.config.notifications).forEach(key => {
            const daysInput = document.getElementById(`${key}-days-before`);
            const messageInput = document.getElementById(`${key}-message`);
            
            if (daysInput) {
                daysInput.addEventListener('input', () => this.updateNotificationPreview(key));
            }
            if (messageInput) {
                messageInput.addEventListener('input', () => this.updateNotificationPreview(key));
            }
        });
        
        // Backup and restore
        document.getElementById('create-backup-btn')?.addEventListener('click', () => this.createBackup());
        document.getElementById('restore-data-btn')?.addEventListener('click', () => this.restoreData());
        document.getElementById('test-notifications-btn')?.addEventListener('click', () => this.testNotifications());
        
        // Reset buttons
        document.getElementById('reset-windows-btn')?.addEventListener('click', () => this.resetTimeWindows());
        document.getElementById('reset-settings-btn')?.addEventListener('click', () => this.resetSystemSettings());
        
        // Audit logs
        document.getElementById('filter-logs-btn')?.addEventListener('click', () => this.filterAuditLogs());
        document.getElementById('export-logs-btn')?.addEventListener('click', () => this.exportAuditLogs());
    }
    
    /**
     * Populate forms with current configuration
     */
    populateForms() {
        // Forms are already populated in HTML generation
        this.updateWeightageTotal();
        this.updateWindowStatus();
        
        // Update notification previews
        Object.keys(this.config.notifications).forEach(key => {
            this.updateNotificationPreview(key);
        });
    }
    
    /**
     * Update current status display
     */
    updateCurrentStatus() {
        // Update overview stats
        const activeWindows = Object.values(this.config.timeWindows).filter(w => w.active).length;
        document.getElementById('active-windows').textContent = activeWindows;
        
        // These would be loaded from actual data in a real implementation
        document.getElementById('total-users').textContent = '0';
        document.getElementById('goals-completion').textContent = '0%';
        document.getElementById('evaluations-completion').textContent = '0%';
    }
    
    /**
     * Switch configuration tab
     */
    switchConfigTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.config-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        // Load specific content if needed
        if (tabName === 'audit-logs') {
            this.loadAuditLogs();
        }
    }
    
    /**
     * Update window status displays
     */
    updateWindowStatus() {
        Object.keys(this.config.timeWindows).forEach(key => {
            const activeCheckbox = document.getElementById(`${key}-active`);
            const readOnlyCheckbox = document.getElementById(`${key}-readonly`);
            const statusIndicator = document.querySelector(`[data-window="${key}"] .status-indicator`);
            const statusText = document.querySelector(`[data-window="${key}"] .status-text`);
            
            if (activeCheckbox && statusIndicator && statusText) {
                const isActive = activeCheckbox.checked;
                const isReadOnly = readOnlyCheckbox?.checked || false;
                
                statusIndicator.className = `status-indicator ${isActive ? 'active' : 'inactive'}`;
                statusText.textContent = isActive ? (isReadOnly ? 'Active (Read Only)' : 'Active') : 'Inactive';
            }
        });
    }
    
    /**
     * Update weightage total
     */
    updateWeightageTotal() {
        const goalWeightage = parseInt(document.getElementById('goal-weightage')?.value) || 0;
        const competencyWeightage = parseInt(document.getElementById('competency-weightage')?.value) || 0;
        const total = goalWeightage + competencyWeightage;
        
        const totalElement = document.getElementById('total-weightage');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.className = total === 100 ? 'text-success' : 'text-error';
        }
    }
    
    /**
     * Update notification preview
     */
    updateNotificationPreview(key) {
        const daysInput = document.getElementById(`${key}-days-before`);
        const messageInput = document.getElementById(`${key}-message`);
        const previewElement = document.getElementById(`${key}-preview`);
        
        if (daysInput && messageInput && previewElement) {
            const days = daysInput.value;
            const message = messageInput.value;
            previewElement.textContent = message.replace('{days}', days);
        }
    }
    
    /**
     * Save time windows configuration
     */
    async saveTimeWindows() {
        try {
            const updatedWindows = {};
            
            Object.keys(this.config.timeWindows).forEach(key => {
                updatedWindows[key] = {
                    ...this.config.timeWindows[key],
                    active: document.getElementById(`${key}-active`).checked,
                    readOnly: document.getElementById(`${key}-readonly`)?.checked || false,
                    startMonth: parseInt(document.getElementById(`${key}-start-month`).value),
                    endMonth: parseInt(document.getElementById(`${key}-end-month`).value)
                };
            });
            
            this.config.timeWindows = updatedWindows;
            
            // Save to backend
            await this.saveConfiguration();
            
            window.App.showNotification('Time windows configuration saved successfully!', 'success');
            this.updateWindowStatus();
            
        } catch (error) {
            console.error('Error saving time windows:', error);
            window.App.showNotification('Error saving time windows: ' + error.message, 'error');
        }
    }
    
    /**
     * Save system settings
     */
    async saveSystemSettings() {
        try {
            const goalWeightage = parseInt(document.getElementById('goal-weightage').value);
            const competencyWeightage = parseInt(document.getElementById('competency-weightage').value);
            
            if (goalWeightage + competencyWeightage !== 100) {
                window.App.showNotification('Goal and Competency weightages must total 100%', 'error');
                return;
            }
            
            this.config.systemSettings = {
                ...this.config.systemSettings,
                organizationName: document.getElementById('org-name').value,
                financialYearStart: parseInt(document.getElementById('financial-year-start').value),
                maxGoalsPerEmployee: parseInt(document.getElementById('max-goals').value),
                minGoalsPerEmployee: parseInt(document.getElementById('min-goals').value),
                maxKPIsPerGoal: parseInt(document.getElementById('max-kpis').value),
                minKPIsPerGoal: parseInt(document.getElementById('min-kpis').value),
                minWeightagePerGoal: parseInt(document.getElementById('min-weightage').value),
                goalWeightage: goalWeightage,
                competencyWeightage: competencyWeightage,
                autoSaveInterval: parseInt(document.getElementById('auto-save-interval').value),
                sessionTimeout: parseInt(document.getElementById('session-timeout').value),
                enableNotifications: document.getElementById('enable-notifications').checked,
                enableAutoSave: document.getElementById('enable-auto-save').checked,
                enableOfflineMode: document.getElementById('enable-offline-mode').checked,
                theme: document.getElementById('theme-select').value
            };
            
            // Save to backend
            await this.saveConfiguration();
            
            window.App.showNotification('System settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving system settings:', error);
            window.App.showNotification('Error saving system settings: ' + error.message, 'error');
        }
    }
    
    /**
     * Save notification settings
     */
    async saveNotificationSettings() {
        try {
            Object.keys(this.config.notifications).forEach(key => {
                this.config.notifications[key] = {
                    ...this.config.notifications[key],
                    enabled: document.getElementById(`${key}-enabled`).checked,
                    daysBefore: parseInt(document.getElementById(`${key}-days-before`).value),
                    message: document.getElementById(`${key}-message`).value
                };
            });
            
            // Save to backend
            await this.saveConfiguration();
            
            window.App.showNotification('Notification settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving notification settings:', error);
            window.App.showNotification('Error saving notification settings: ' + error.message, 'error');
        }
    }
    
    /**
     * Save configuration to backend
     */
    async saveConfiguration() {
        try {
            await window.DataHandler.updateSystemSettings?.(this.config) || 
                  localStorage.setItem('pms_system_config', JSON.stringify(this.config));
            
            // Log configuration change
            window.AuthManager.logActivity?.('config_change', {
                timestamp: new Date().toISOString(),
                changes: 'System configuration updated'
            });
            
        } catch (error) {
            throw new Error('Failed to save configuration: ' + error.message);
        }
    }
    
    /**
     * Reset time windows to default
     */
    resetTimeWindows() {
        if (confirm('Are you sure you want to reset time windows to default settings?')) {
            // Reset to default values and re-populate form
            this.config.timeWindows = new SystemConfigManager().config.timeWindows;
            this.loadContent();
        }
    }
    
    /**
     * Reset system settings to default
     */
    resetSystemSettings() {
        if (confirm('Are you sure you want to reset system settings to default values?')) {
            // Reset to default values and re-populate form
            this.config.systemSettings = new SystemConfigManager().config.systemSettings;
            this.loadContent();
        }
    }
    
    /**
     * Test notifications
     */
    testNotifications() {
        Object.keys(this.config.notifications).forEach(key => {
            const notification = this.config.notifications[key];
            if (notification.enabled) {
                const message = notification.message.replace('{days}', notification.daysBefore);
                window.App.showNotification(message, 'info');
            }
        });
    }
    
    /**
     * Create system backup
     */
    async createBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {
                    users: document.getElementById('backup-users').checked ? await this.getUsersData() : null,
                    goals: document.getElementById('backup-goals').checked ? await this.getGoalsData() : null,
                    competencies: document.getElementById('backup-competencies').checked ? await this.getCompetenciesData() : null,
                    config: document.getElementById('backup-config').checked ? this.config : null
                }
            };
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pms_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            window.App.showNotification('Backup created successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating backup:', error);
            window.App.showNotification('Error creating backup: ' + error.message, 'error');
        }
    }
    
    /**
     * Restore data from backup
     */
    async restoreData() {
        const fileInput = document.getElementById('restore-file');
        if (!fileInput.files[0]) {
            window.App.showNotification('Please select a backup file', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to restore data? This will overwrite existing data.')) {
            return;
        }
        
        try {
            const file = fileInput.files[0];
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            // Validate backup format
            if (!backupData.data) {
                throw new Error('Invalid backup file format');
            }
            
            // Restore data
            if (backupData.data.users) {
                await this.restoreUsersData(backupData.data.users);
            }
            if (backupData.data.goals) {
                await this.restoreGoalsData(backupData.data.goals);
            }
            if (backupData.data.competencies) {
                await this.restoreCompetenciesData(backupData.data.competencies);
            }
            if (backupData.data.config) {
                this.config = backupData.data.config;
                await this.saveConfiguration();
            }
            
            window.App.showNotification('Data restored successfully!', 'success');
            this.loadContent();
            
        } catch (error) {
            console.error('Error restoring data:', error);
            window.App.showNotification('Error restoring data: ' + error.message, 'error');
        }
    }
    
    /**
     * Load audit logs
     */
    async loadAuditLogs() {
        try {
            const logs = window.AuthManager.getActivityLogs?.() || [];
            this.displayAuditLogs(logs);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    }
    
    /**
     * Display audit logs in table
     */
    displayAuditLogs(logs) {
        const tbody = document.getElementById('audit-logs-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.empCode}</td>
                <td>${log.action}</td>
                <td>${JSON.stringify(log.details)}</td>
                <td>${log.details.ipAddress || 'N/A'}</td>
            </tr>
        `).join('');
    }
    
    /**
     * Filter audit logs
     */
    filterAuditLogs() {
        // Implementation for filtering logs
        this.loadAuditLogs();
    }
    
    /**
     * Export audit logs
     */
    exportAuditLogs() {
        const logs = window.AuthManager.getActivityLogs?.() || [];
        window.DataHandler.exportToCSV(logs, 'audit_logs.csv');
    }
    
    /**
     * Helper methods for backup/restore
     */
    async getUsersData() {
        return window.UserRolesManager?.users || [];
    }
    
    async getGoalsData() {
        // This would collect all goals data
        return {};
    }
    
    async getCompetenciesData() {
        // This would collect all competency data
        return {};
    }
    
    async restoreUsersData(data) {
        // This would restore users data
        console.log('Restoring users data:', data);
    }
    
    async restoreGoalsData(data) {
        // This would restore goals data
        console.log('Restoring goals data:', data);
    }
    
    async restoreCompetenciesData(data) {
        // This would restore competencies data
        console.log('Restoring competencies data:', data);
    }
}

// Initialize global instance
window.SystemConfigManager = new SystemConfigManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemConfigManager;
}