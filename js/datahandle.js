/**
 * DataHandle.js - Handles all API connections, database operations, and data management
 * Connects to Google Apps Script backend and manages local SQLite operations
 */

class DataHandler {
    constructor() {
        this.config = {
            // Google Apps Script Web App URL (to be configured)
            gasUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
            
            // Local SQLite database
            dbName: 'performance_management.db',
            
            // API endpoints
            endpoints: {
                auth: '/auth',
                employee: '/employee',
                goals: '/goals',
                competencies: '/competencies',
                competencyMaster: '/competencies/master',
                systemConfig: '/system',
                timeWindow: '/system/timewindow',
                reports: '/reports',
                performance: '/performance'
            },
            
            // Request timeout
            timeout: 30000,
            
            // Retry configuration
            maxRetries: 3,
            retryDelay: 1000
        };
        
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        
        this.initializeDatabase();
        this.setupEventListeners();
    }
    
    /**
     * Initialize local SQLite database
     */
    async initializeDatabase() {
        try {
            // Note: In a real implementation, you'd use a library like sql.js or better-sqlite3
            // For this example, we'll use localStorage as a fallback
            if (typeof window !== 'undefined' && window.localStorage) {
                this.db = {
                    employees: this.getLocalData('employees') || {},
                    goals: this.getLocalData('goals') || {},
                    competencies: this.getLocalData('competencies') || {},
                    competencyMaster: this.getLocalData('competencyMaster') || [],
                    systemConfig: this.getLocalData('systemConfig') || {},
                    syncQueue: this.getLocalData('syncQueue') || []
                };
            }
            
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.showNotification('Database initialization failed', 'error');
        }
    }
    
    /**
     * Setup event listeners for online/offline status
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    /**
     * Generic API request handler with retry logic
     */
    async makeRequest(endpoint, method = 'GET', data = null, retryCount = 0) {
        const url = `${this.config.gasUrl}${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            timeout: this.config.timeout
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error(`API request failed (${method} ${endpoint}):`, error);
            
            // Retry logic
            if (retryCount < this.config.maxRetries) {
                console.log(`Retrying request... Attempt ${retryCount + 1}`);
                await this.delay(this.config.retryDelay * (retryCount + 1));
                return this.makeRequest(endpoint, method, data, retryCount + 1);
            }
            
            // If offline, add to sync queue
            if (!this.isOnline && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                this.addToSyncQueue(endpoint, method, data);
            }
            
            throw error;
        }
    }
    
    /**
     * Authentication Methods
     */
    
    /**
     * Authenticate user with employee code
     */
    async authenticateUser(employeeCode) {
        try {
            const response = await this.makeRequest(
                this.config.endpoints.auth, 
                'POST', 
                { employeeCode }
            );
            
            if (response.success) {
                // Store authentication token and user data
                this.setAuthToken(response.token);
                this.setLocalData('currentUser', response.user);
                
                // Cache user data locally
                this.db.employees[employeeCode] = response.user;
                this.saveLocalData('employees', this.db.employees);
                
                return response;
            } else {
                throw new Error(response.message || 'Authentication failed');
            }
            
        } catch (error) {
            // Try offline authentication
            const cachedUser = this.db.employees[employeeCode];
            if (cachedUser) {
                this.setLocalData('currentUser', cachedUser);
                return { success: true, user: cachedUser, offline: true };
            }
            
            throw error;
        }
    }
    
    /**
     * Logout user
     */
    logout() {
        this.removeAuthToken();
        this.removeLocalData('currentUser');
        this.clearSyncQueue();
    }
    
    /**
     * Employee Data Methods
     */
    
    /**
     * Get employee details
     */
    async getEmployeeDetails(empCode) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.employee}/${empCode}`
            );
            
            // Cache locally
            this.db.employees[empCode] = response.data;
            this.saveLocalData('employees', this.db.employees);
            
            return response.data;
            
        } catch (error) {
            // Return cached data if available
            const cached = this.db.employees[empCode];
            if (cached) {
                return cached;
            }
            throw error;
        }
    }
    
    /**
     * Update employee details
     */
    async updateEmployeeDetails(empCode, data) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.employee}/${empCode}`,
                'PUT',
                data
            );
            
            // Update local cache
            this.db.employees[empCode] = { ...this.db.employees[empCode], ...data };
            this.saveLocalData('employees', this.db.employees);
            
            return response;
            
        } catch (error) {
            // Store in sync queue for later
            this.addToSyncQueue(`${this.config.endpoints.employee}/${empCode}`, 'PUT', data);
            
            // Update local cache optimistically
            this.db.employees[empCode] = { ...this.db.employees[empCode], ...data };
            this.saveLocalData('employees', this.db.employees);
            
            throw error;
        }
    }
    
    /**
     * SMART Goals Data Methods
     */
    
    /**
     * Get goals for employee
     */
    async getGoals(empCode) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.goals}/${empCode}`
            );
            
            // Cache locally
            this.db.goals[empCode] = response.data;
            this.saveLocalData('goals', this.db.goals);
            
            return response.data;
            
        } catch (error) {
            // Return cached data
            const cached = this.db.goals[empCode];
            if (cached) {
                return cached;
            }
            throw error;
        }
    }
    
    /**
     * Save/Update goals for employee
     */
    async saveGoals(empCode, goalsData) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.goals}/${empCode}`,
                'POST',
                goalsData
            );
            
            // Update local cache
            this.db.goals[empCode] = goalsData;
            this.saveLocalData('goals', this.db.goals);
            
            return response;
            
        } catch (error) {
            // Store in sync queue
            this.addToSyncQueue(`${this.config.endpoints.goals}/${empCode}`, 'POST', goalsData);
            
            // Update local cache optimistically
            this.db.goals[empCode] = goalsData;
            this.saveLocalData('goals', this.db.goals);
            
            throw error;
        }
    }
    
    /**
     * Update specific goal
     */
    async updateGoal(empCode, goalId, goalData) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.goals}/${empCode}/${goalId}`,
                'PUT',
                goalData
            );
            
            // Update local cache
            if (this.db.goals[empCode]) {
                const goalIndex = this.db.goals[empCode].findIndex(g => g.id === goalId);
                if (goalIndex !== -1) {
                    this.db.goals[empCode][goalIndex] = { ...this.db.goals[empCode][goalIndex], ...goalData };
                    this.saveLocalData('goals', this.db.goals);
                }
            }
            
            return response;
            
        } catch (error) {
            this.addToSyncQueue(`${this.config.endpoints.goals}/${empCode}/${goalId}`, 'PUT', goalData);
            throw error;
        }
    }
    
    /**
     * Delete goal
     */
    async deleteGoal(empCode, goalId) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.goals}/${empCode}/${goalId}`,
                'DELETE'
            );
            
            // Update local cache
            if (this.db.goals[empCode]) {
                this.db.goals[empCode] = this.db.goals[empCode].filter(g => g.id !== goalId);
                this.saveLocalData('goals', this.db.goals);
            }
            
            return response;
            
        } catch (error) {
            this.addToSyncQueue(`${this.config.endpoints.goals}/${empCode}/${goalId}`, 'DELETE');
            throw error;
        }
    }
    
    /**
     * Behavioural Competency Methods
     */
    
    /**
     * Get competency master data
     */
    async getCompetencyMaster() {
        try {
            const response = await this.makeRequest(this.config.endpoints.competencyMaster);
            
            // Cache locally
            this.db.competencyMaster = response.data;
            this.saveLocalData('competencyMaster', this.db.competencyMaster);
            
            return response.data;
            
        } catch (error) {
            // Return cached data
            if (this.db.competencyMaster.length > 0) {
                return this.db.competencyMaster;
            }
            throw error;
        }
    }
    
    /**
     * Get behavioural competencies for employee
     */
    async getBehaviouralCompetencies(empCode) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.competencies}/${empCode}`
            );
            
            // Cache locally
            this.db.competencies[empCode] = response.data;
            this.saveLocalData('competencies', this.db.competencies);
            
            return response.data;
            
        } catch (error) {
            // Return cached data
            const cached = this.db.competencies[empCode];
            if (cached) {
                return cached;
            }
            throw error;
        }
    }
    
    /**
     * Save behavioural competencies
     */
    async saveBehaviouralCompetencies(empCode, competencyData) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.competencies}/${empCode}`,
                'POST',
                competencyData
            );
            
            // Update local cache
            this.db.competencies[empCode] = competencyData;
            this.saveLocalData('competencies', this.db.competencies);
            
            return response;
            
        } catch (error) {
            // Store in sync queue
            this.addToSyncQueue(`${this.config.endpoints.competencies}/${empCode}`, 'POST', competencyData);
            
            // Update local cache optimistically
            this.db.competencies[empCode] = competencyData;
            this.saveLocalData('competencies', this.db.competencies);
            
            throw error;
        }
    }
    
    /**
     * System Configuration Methods
     */
    
    /**
     * Get current time window configuration
     */
    async getActiveTimeWindow() {
        try {
            const response = await this.makeRequest(this.config.endpoints.timeWindow);
            
            // Cache locally
            this.db.systemConfig.timeWindow = response.data;
            this.saveLocalData('systemConfig', this.db.systemConfig);
            
            return response.data;
            
        } catch (error) {
            // Return cached data
            if (this.db.systemConfig.timeWindow) {
                return this.db.systemConfig.timeWindow;
            }
            throw error;
        }
    }
    
    /**
     * Update system settings (Admin only)
     */
    async updateSystemSettings(settings) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.systemConfig}/settings`,
                'POST',
                settings
            );
            
            // Update local cache
            this.db.systemConfig = { ...this.db.systemConfig, ...settings };
            this.saveLocalData('systemConfig', this.db.systemConfig);
            
            return response;
            
        } catch (error) {
            this.addToSyncQueue(`${this.config.endpoints.systemConfig}/settings`, 'POST', settings);
            throw error;
        }
    }
    
    /**
     * Reports and Analytics Methods
     */
    
    /**
     * Get performance summary for employee
     */
    async getPerformanceSummary(empCode) {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.performance}/summary/${empCode}`
            );
            return response.data;
            
        } catch (error) {
            // Calculate from cached data
            return this.calculateOfflinePerformanceSummary(empCode);
        }
    }
    
    /**
     * Export reports
     */
    async exportReports(filters, format = 'pdf') {
        try {
            const response = await this.makeRequest(
                `${this.config.endpoints.reports}/export`,
                'POST',
                { ...filters, format }
            );
            return response;
            
        } catch (error) {
            throw new Error('Export functionality requires online connection');
        }
    }
    
    /**
     * Utility Methods
     */
    
    /**
     * Calculate performance summary from cached data
     */
    calculateOfflinePerformanceSummary(empCode) {
        const goals = this.db.goals[empCode] || [];
        const competencies = this.db.competencies[empCode] || [];
        
        // Calculate goals progress
        const completedGoals = goals.filter(g => g.achieved_ratio >= 100).length;
        const goalsProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
        
        // Calculate competency average
        const competencyScores = competencies.map(c => c.competency_total_score || 0);
        const competencyAverage = competencyScores.length > 0 
            ? competencyScores.reduce((a, b) => a + b, 0) / competencyScores.length 
            : 0;
        
        // Calculate overall rating
        const overallRating = (goalsProgress * 0.7 + competencyAverage * 0.3);
        
        return {
            goalsProgress: Math.round(goalsProgress),
            competencyAverage: Math.round(competencyAverage * 20) / 20, // Round to nearest 0.05
            overallRating: Math.round(overallRating),
            offline: true
        };
    }
    
    /**
     * Sync queue management
     */
    addToSyncQueue(endpoint, method, data) {
        const syncItem = {
            id: Date.now() + Math.random(),
            endpoint,
            method,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        this.syncQueue.push(syncItem);
        this.saveLocalData('syncQueue', this.syncQueue);
    }
    
    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return;
        }
        
        console.log(`Processing ${this.syncQueue.length} queued operations...`);
        
        const processedItems = [];
        
        for (const item of this.syncQueue) {
            try {
                await this.makeRequest(item.endpoint, item.method, item.data);
                processedItems.push(item.id);
                console.log(`Synced: ${item.method} ${item.endpoint}`);
                
            } catch (error) {
                item.retryCount++;
                if (item.retryCount >= this.config.maxRetries) {
                    console.error(`Failed to sync after ${this.config.maxRetries} attempts:`, item);
                    processedItems.push(item.id); // Remove from queue
                }
            }
        }
        
        // Remove processed items
        this.syncQueue = this.syncQueue.filter(item => !processedItems.includes(item.id));
        this.saveLocalData('syncQueue', this.syncQueue);
        
        if (processedItems.length > 0) {
            this.showNotification(`Synced ${processedItems.length} operations`, 'success');
        }
    }
    
    clearSyncQueue() {
        this.syncQueue = [];
        this.saveLocalData('syncQueue', this.syncQueue);
    }
    
    /**
     * Local storage helpers
     */
    getLocalData(key) {
        try {
            const data = localStorage.getItem(`pms_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Failed to get local data for ${key}:`, error);
            return null;
        }
    }
    
    saveLocalData(key, data) {
        try {
            localStorage.setItem(`pms_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save local data for ${key}:`, error);
        }
    }
    
    removeLocalData(key) {
        try {
            localStorage.removeItem(`pms_${key}`);
        } catch (error) {
            console.error(`Failed to remove local data for ${key}:`, error);
        }
    }
    
    /**
     * Authentication helpers
     */
    getAuthToken() {
        return localStorage.getItem('pms_auth_token');
    }
    
    setAuthToken(token) {
        localStorage.setItem('pms_auth_token', token);
    }
    
    removeAuthToken() {
        localStorage.removeItem('pms_auth_token');
    }
    
    /**
     * Validation helpers
     */
    validateGoalsData(goalsData) {
        const errors = [];
        
        if (!Array.isArray(goalsData) || goalsData.length < 4 || goalsData.length > 5) {
            errors.push('Must have between 4-5 SMART goals');
        }
        
        let totalWeightage = 0;
        goalsData.forEach((goal, index) => {
            if (!goal.kra_title || goal.kra_title.trim().length === 0) {
                errors.push(`Goal ${index + 1}: KRA title is required`);
            }
            
            if (!goal.kpis || goal.kpis.length < 2 || goal.kpis.length > 3) {
                errors.push(`Goal ${index + 1}: Must have 2-3 KPIs`);
            }
            
            if (!goal.weightage || goal.weightage < 4) {
                errors.push(`Goal ${index + 1}: Minimum weightage is 4%`);
            }
            
            totalWeightage += goal.weightage || 0;
        });
        
        if (totalWeightage > 100) {
            errors.push('Total weightage cannot exceed 100%');
        }
        
        return errors;
    }
    
    validateCompetencyData(competencyData) {
        const errors = [];
        
        competencyData.forEach((competency, index) => {
            if (!competency.behaviour_1 || competency.behaviour_1.trim().length === 0) {
                errors.push(`Competency ${index + 1}: First behaviour demonstration is required`);
            }
            
            if (!competency.behaviour_2 || competency.behaviour_2.trim().length === 0) {
                errors.push(`Competency ${index + 1}: Second behaviour demonstration is required`);
            }
            
            if (!competency.behaviour_1_score || competency.behaviour_1_score < 1 || competency.behaviour_1_score > 5) {
                errors.push(`Competency ${index + 1}: First behaviour score must be between 1-5`);
            }
            
            if (!competency.behaviour_2_score || competency.behaviour_2_score < 1 || competency.behaviour_2_score > 5) {
                errors.push(`Competency ${index + 1}: Second behaviour score must be between 1-5`);
            }
        });
        
        return errors;
    }
    
    /**
     * Utility functions
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showNotification(message, type = 'info') {
        // This will be implemented by the main app
        if (window.App && window.App.showNotification) {
            window.App.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * Data export utilities
     */
    exportToCSV(data, filename) {
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, filename, 'text/csv');
    }
    
    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        
        return csvContent;
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Create global instance
window.DataHandler = new DataHandler();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataHandler;
}