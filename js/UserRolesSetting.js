/**
 * UserRolesSetting.js - User Roles Management Module
 * Handles user role assignments, permissions, and access control
 * Admin-only functionality
 */

class UserRolesManager {
    constructor() {
        this.users = [];
        this.roles = {
            'admin': {
                name: 'Administrator',
                description: 'Full system access and configuration',
                permissions: ['*'],
                level: 100,
                color: '#dc2626'
            },
            'approval_manager1': {
                name: 'Approval Manager 1',
                description: 'Department-level approvals and management',
                permissions: ['view_all', 'approve_department', 'manage_department'],
                level: 80,
                color: '#059669'
            },
            'approval_manager2': {
                name: 'Approval Manager 2',
                description: 'Division-level approvals and management',
                permissions: ['view_all', 'approve_division', 'manage_division'],
                level: 85,
                color: '#0ea5e9'
            },
            'hr_manager1': {
                name: 'HR Manager 1',
                description: 'HR operations and employee management',
                permissions: ['view_all', 'manage_hr', 'view_reports'],
                level: 70,
                color: '#7c3aed'
            },
            'hr_manager2': {
                name: 'HR Manager 2',
                description: 'Senior HR approvals and strategic HR functions',
                permissions: ['view_all', 'manage_hr', 'view_reports', 'approve_hr'],
                level: 75,
                color: '#8b5cf6'
            },
            'individual_user': {
                name: 'Individual User',
                description: 'Self-service performance management',
                permissions: ['view_own', 'edit_own'],
                level: 10,
                color: '#64748b'
            }
        };
        
        this.departments = [
            'Human Resources',
            'Information Technology',
            'Finance',
            'Sales',
            'Operations',
            'Marketing',
            'Legal',
            'Administration'
        ];
        
        this.divisions = [
            'Corporate',
            'Regional North',
            'Regional South',
            'Regional East',
            'Regional West',
            'International'
        ];
        
        this.locations = [
            'Head Office',
            'Branch Office 1',
            'Branch Office 2',
            'Branch Office 3',
            'Remote'
        ];
        
        this.init();
    }
    
    /**
     * Initialize User Roles module
     */
    init() {
        this.bindEvents();
        this.checkPermissions();
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
        const contentDiv = document.querySelector('#roles-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="access-denied">
                    <div class="access-denied-icon">🔒</div>
                    <h3>Access Denied</h3>
                    <p>You don't have permission to access user roles management.</p>
                    <p>This functionality is restricted to system administrators only.</p>
                </div>
            `;
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab activation
        document.addEventListener('tab-activated', (e) => {
            if (e.detail.tabId === 'user-roles') {
                this.loadContent();
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'user-form') {
                e.preventDefault();
                this.saveUser();
            } else if (e.target.id === 'bulk-import-form') {
                e.preventDefault();
                this.processBulkImport();
            }
        });
    }
    
    /**
     * Load user roles content
     */
    async loadContent() {
        const contentDiv = document.querySelector('#roles-content');
        if (!contentDiv) return;
        
        if (!this.checkPermissions()) {
            return;
        }
        
        try {
            // Show loading
            contentDiv.innerHTML = this.getLoadingHTML();
            
            // Load users data
            await this.loadUsers();
            
            // Render content
            contentDiv.innerHTML = this.getContentHTML();
            
            // Bind dynamic events
            this.bindDynamicEvents();
            
            // Initialize data table
            this.initializeDataTable();
            
        } catch (error) {
            console.error('Error loading user roles content:', error);
            contentDiv.innerHTML = this.getErrorHTML(error.message);
        }
    }
    
    /**
     * Load users data
     */
    async loadUsers() {
        try {
            // In a real implementation, this would load from the backend
            this.users = await window.DataHandler.getAllUsers?.() || this.generateSampleUsers();
        } catch (error) {
            console.log('Using sample users data');
            this.users = this.generateSampleUsers();
        }
    }
    
    /**
     * Generate sample users for demonstration
     */
    generateSampleUsers() {
        return [
            {
                emp_code: 'ADM001',
                name: 'System Administrator',
                division: 'Corporate',
                designation: 'System Admin',
                location: 'Head Office',
                department: 'Information Technology',
                user_type: 'admin',
                email: 'admin@company.com',
                status: 'active',
                created_date: '2024-01-01',
                last_login: '2024-01-15'
            },
            {
                emp_code: 'MGR001',
                name: 'John Manager',
                division: 'Regional North',
                designation: 'Department Manager',
                location: 'Branch Office 1',
                department: 'Sales',
                user_type: 'approval_manager1',
                email: 'john.manager@company.com',
                status: 'active',
                created_date: '2024-01-02',
                last_login: '2024-01-14'
            },
            {
                emp_code: 'HR001',
                name: 'Sarah HR',
                division: 'Corporate',
                designation: 'HR Manager',
                location: 'Head Office',
                department: 'Human Resources',
                user_type: 'hr_manager1',
                email: 'sarah.hr@company.com',
                status: 'active',
                created_date: '2024-01-03',
                last_login: '2024-01-13'
            },
            {
                emp_code: 'EMP001',
                name: 'Alice Employee',
                division: 'Regional South',
                designation: 'Senior Executive',
                location: 'Branch Office 2',
                department: 'Finance',
                user_type: 'individual_user',
                email: 'alice.employee@company.com',
                status: 'active',
                created_date: '2024-01-04',
                last_login: '2024-01-12'
            },
            {
                emp_code: 'EMP002',
                name: 'Bob Worker',
                division: 'Regional East',
                designation: 'Executive',
                location: 'Branch Office 3',
                department: 'Operations',
                user_type: 'individual_user',
                email: 'bob.worker@company.com',
                status: 'inactive',
                created_date: '2024-01-05',
                last_login: '2024-01-10'
            }
        ];
    }
    
    /**
     * Get loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="text-center p-8">
                <div class="spinner mx-auto mb-4"></div>
                <p>Loading user roles management...</p>
            </div>
        `;
    }
    
    /**
     * Get error HTML
     */
    getErrorHTML(message) {
        return `
            <div class="alert alert-error">
                <h4>Error Loading User Roles</h4>
                <p>${message}</p>
                <button class="btn btn-primary mt-4" onclick="window.UserRolesManager.loadContent()">
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
            <div class="user-roles-container">
                ${this.getStatsHTML()}
                ${this.getActionsHTML()}
                ${this.getUsersTableHTML()}
                ${this.getUserModalHTML()}
                ${this.getBulkImportModalHTML()}
            </div>
        `;
    }
    
    /**
     * Get statistics HTML
     */
    getStatsHTML() {
        const stats = this.calculateStats();
        
        return `
            <div class="stats-cards">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.totalUsers}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.activeUsers}</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👑</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.adminUsers}</div>
                        <div class="stat-label">Admin Users</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.managerUsers}</div>
                        <div class="stat-label">Manager Users</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get actions HTML
     */
    getActionsHTML() {
        return `
            <div class="actions-bar">
                <div class="actions-left">
                    <h4>User Management</h4>
                    <p class="text-muted">Manage user accounts, roles, and permissions</p>
                </div>
                <div class="actions-right">
                    <button id="add-user-btn" class="btn btn-primary">
                        <span class="btn-icon">➕</span>
                        Add User
                    </button>
                    <button id="bulk-import-btn" class="btn btn-outline">
                        <span class="btn-icon">📁</span>
                        Bulk Import
                    </button>
                    <button id="export-users-btn" class="btn btn-secondary">
                        <span class="btn-icon">📤</span>
                        Export
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Get users table HTML
     */
    getUsersTableHTML() {
        return `
            <div class="users-table-container">
                <div class="table-header">
                    <div class="table-filters">
                        <select id="role-filter" class="form-control">
                            <option value="">All Roles</option>
                            ${Object.entries(this.roles).map(([key, role]) => `
                                <option value="${key}">${role.name}</option>
                            `).join('')}
                        </select>
                        <select id="status-filter" class="form-control">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select id="department-filter" class="form-control">
                            <option value="">All Departments</option>
                            ${this.departments.map(dept => `
                                <option value="${dept}">${dept}</option>
                            `).join('')}
                        </select>
                        <input type="text" id="search-users" class="form-control" placeholder="Search users...">
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table id="users-table" class="table">
                        <thead>
                            <tr>
                                <th>Employee Code</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Division</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            ${this.getUsersTableRows()}
                        </tbody>
                    </table>
                </div>
                
                <div class="table-footer">
                    <div class="table-info">
                        Showing <span id="showing-count">${this.users.length}</span> of <span id="total-count">${this.users.length}</span> users
                    </div>
                    <div class="table-pagination">
                        <!-- Pagination would be implemented here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get users table rows HTML
     */
    getUsersTableRows() {
        return this.users.map(user => `
            <tr data-user-id="${user.emp_code}">
                <td>
                    <div class="user-code">
                        <strong>${user.emp_code}</strong>
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email || 'No email'}</div>
                    </div>
                </td>
                <td>
                    <div class="role-badge" style="background-color: ${this.roles[user.user_type]?.color}20; color: ${this.roles[user.user_type]?.color}">
                        ${this.roles[user.user_type]?.name || user.user_type}
                    </div>
                </td>
                <td>${user.department}</td>
                <td>${user.division}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status === 'active' ? '✅ Active' : '❌ Inactive'}
                    </span>
                </td>
                <td>
                    <div class="last-login">
                        ${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline edit-user-btn" data-user-id="${user.emp_code}">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-error delete-user-btn" data-user-id="${user.emp_code}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * Get user modal HTML
     */
    getUserModalHTML() {
        return `
            <div id="user-modal" class="modal-container hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3 id="user-modal-title">Add User</h3>
                        <button type="button" class="modal-close" id="close-user-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="user-form" class="user-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="user-emp-code" class="required">Employee Code</label>
                                    <input type="text" id="user-emp-code" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label for="user-name" class="required">Full Name</label>
                                    <input type="text" id="user-name" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label for="user-email">Email Address</label>
                                    <input type="email" id="user-email" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="user-designation">Designation</label>
                                    <input type="text" id="user-designation" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="user-department" class="required">Department</label>
                                    <select id="user-department" class="form-control" required>
                                        <option value="">Select Department</option>
                                        ${this.departments.map(dept => `
                                            <option value="${dept}">${dept}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="user-division" class="required">Division</label>
                                    <select id="user-division" class="form-control" required>
                                        <option value="">Select Division</option>
                                        ${this.divisions.map(div => `
                                            <option value="${div}">${div}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="user-location" class="required">Location</label>
                                    <select id="user-location" class="form-control" required>
                                        <option value="">Select Location</option>
                                        ${this.locations.map(loc => `
                                            <option value="${loc}">${loc}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="user-role" class="required">User Role</label>
                                    <select id="user-role" class="form-control" required>
                                        <option value="">Select Role</option>
                                        ${Object.entries(this.roles).map(([key, role]) => `
                                            <option value="${key}">${role.name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="user-status" class="required">Status</label>
                                    <select id="user-status" class="form-control" required>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="role-description" id="role-description">
                                <h6>Role Description</h6>
                                <p id="role-description-text">Select a role to see its description and permissions.</p>
                                <div id="role-permissions" class="role-permissions"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-user-modal">Cancel</button>
                        <button type="submit" form="user-form" class="btn btn-primary" id="save-user-btn">Save User</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get bulk import modal HTML
     */
    getBulkImportModalHTML() {
        return `
            <div id="bulk-import-modal" class="modal-container hidden">
                <div class="modal modal-large">
                    <div class="modal-header">
                        <h3>Bulk Import Users</h3>
                        <button type="button" class="modal-close" id="close-bulk-import-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="import-instructions">
                            <h5>Import Instructions</h5>
                            <ul>
                                <li>Upload a CSV file with user data</li>
                                <li>Required columns: emp_code, name, department, division, location, user_type</li>
                                <li>Optional columns: email, designation, status</li>
                                <li>Download the template file to see the required format</li>
                            </ul>
                            <button type="button" id="download-template-btn" class="btn btn-outline">
                                Download Template
                            </button>
                        </div>
                        
                        <form id="bulk-import-form" class="bulk-import-form">
                            <div class="form-group">
                                <label for="import-file" class="required">Select CSV File</label>
                                <input type="file" id="import-file" class="form-control" accept=".csv" required>
                            </div>
                            
                            <div class="import-options">
                                <div class="checkbox">
                                    <input type="checkbox" id="skip-duplicates" checked>
                                    <label for="skip-duplicates">Skip duplicate employee codes</label>
                                </div>
                                <div class="checkbox">
                                    <input type="checkbox" id="validate-data" checked>
                                    <label for="validate-data">Validate data before import</label>
                                </div>
                            </div>
                            
                            <div id="import-preview" class="import-preview hidden">
                                <h6>Import Preview</h6>
                                <div id="preview-stats" class="preview-stats"></div>
                                <div id="preview-table" class="preview-table"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-bulk-import">Cancel</button>
                        <button type="submit" form="bulk-import-form" class="btn btn-primary" id="process-import-btn">Process Import</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind dynamic events
     */
    bindDynamicEvents() {
        // Action buttons
        document.getElementById('add-user-btn')?.addEventListener('click', () => this.showUserModal());
        document.getElementById('bulk-import-btn')?.addEventListener('click', () => this.showBulkImportModal());
        document.getElementById('export-users-btn')?.addEventListener('click', () => this.exportUsers());
        
        // Modal close buttons
        document.getElementById('close-user-modal')?.addEventListener('click', () => this.hideUserModal());
        document.getElementById('cancel-user-modal')?.addEventListener('click', () => this.hideUserModal());
        document.getElementById('close-bulk-import-modal')?.addEventListener('click', () => this.hideBulkImportModal());
        document.getElementById('cancel-bulk-import')?.addEventListener('click', () => this.hideBulkImportModal());
        
        // User role change
        document.getElementById('user-role')?.addEventListener('change', (e) => this.updateRoleDescription(e.target.value));
        
        // Table filters
        document.getElementById('role-filter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('status-filter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('department-filter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('search-users')?.addEventListener('input', () => this.filterUsers());
        
        // User action buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.editUser(userId);
            });
        });
        
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.deleteUser(userId);
            });
        });
        
        // Bulk import events
        document.getElementById('download-template-btn')?.addEventListener('click', () => this.downloadTemplate());
        document.getElementById('import-file')?.addEventListener('change', (e) => this.previewImport(e.target.files[0]));
    }
    
    /**
     * Initialize data table functionality
     */
    initializeDataTable() {
        // This would integrate with a data table library like DataTables
        // For now, we'll implement basic functionality
        this.filterUsers();
    }
    
    /**
     * Calculate statistics
     */
    calculateStats() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(u => u.status === 'active').length;
        const adminUsers = this.users.filter(u => u.user_type === 'admin').length;
        const managerUsers = this.users.filter(u => 
            u.user_type.includes('manager') || u.user_type.includes('hr')
        ).length;
        
        return {
            totalUsers,
            activeUsers,
            adminUsers,
            managerUsers
        };
    }
    
    /**
     * Show user modal for adding/editing
     */
    showUserModal(user = null) {
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        
        if (user) {
            title.textContent = 'Edit User';
            this.populateUserForm(user);
        } else {
            title.textContent = 'Add User';
            form.reset();
        }
        
        modal.classList.remove('hidden');
        document.getElementById('user-emp-code')?.focus();
    }
    
    /**
     * Hide user modal
     */
    hideUserModal() {
        const modal = document.getElementById('user-modal');
        modal.classList.add('hidden');
    }
    
    /**
     * Populate user form with data
     */
    populateUserForm(user) {
        document.getElementById('user-emp-code').value = user.emp_code;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-designation').value = user.designation || '';
        document.getElementById('user-department').value = user.department;
        document.getElementById('user-division').value = user.division;
        document.getElementById('user-location').value = user.location;
        document.getElementById('user-role').value = user.user_type;
        document.getElementById('user-status').value = user.status;
        
        // Update role description
        this.updateRoleDescription(user.user_type);
        
        // Disable employee code for editing
        document.getElementById('user-emp-code').disabled = true;
    }
    
    /**
     * Update role description display
     */
    updateRoleDescription(roleKey) {
        const role = this.roles[roleKey];
        const descText = document.getElementById('role-description-text');
        const permissionsDiv = document.getElementById('role-permissions');
        
        if (role && descText && permissionsDiv) {
            descText.textContent = role.description;
            
            permissionsDiv.innerHTML = `
                <div class="permissions-list">
                    <strong>Permissions:</strong>
                    ${role.permissions.map(perm => `
                        <span class="permission-badge">${perm === '*' ? 'All Permissions' : perm}</span>
                    `).join('')}
                </div>
                <div class="role-level">
                    <strong>Access Level:</strong> ${role.level}/100
                </div>
            `;
        }
    }
    
    /**
     * Save user (add or edit)
     */
    async saveUser() {
        try {
            const formData = new FormData(document.getElementById('user-form'));
            const userData = Object.fromEntries(formData.entries());
            
            // Validate data
            const errors = this.validateUserData(userData);
            if (errors.length > 0) {
                window.App.showNotification('Please fix the following errors:\n' + errors.join('\n'), 'error');
                return;
            }
            
            // Show loading
            const saveBtn = document.getElementById('save-user-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }
            
            // Check if editing or adding
            const existingUserIndex = this.users.findIndex(u => u.emp_code === userData['user-emp-code']);
            
            const user = {
                emp_code: userData['user-emp-code'],
                name: userData['user-name'],
                email: userData['user-email'] || '',
                designation: userData['user-designation'] || '',
                department: userData['user-department'],
                division: userData['user-division'],
                location: userData['user-location'],
                user_type: userData['user-role'],
                status: userData['user-status'],
                created_date: existingUserIndex >= 0 ? this.users[existingUserIndex].created_date : new Date().toISOString().split('T')[0],
                last_login: existingUserIndex >= 0 ? this.users[existingUserIndex].last_login : null
            };
            
            // Save to backend
            await window.DataHandler.saveUser?.(user) || this.saveUserLocally(user);
            
            // Update local data
            if (existingUserIndex >= 0) {
                this.users[existingUserIndex] = user;
            } else {
                this.users.push(user);
            }
            
            // Update UI
            this.refreshUsersTable();
            this.hideUserModal();
            
            window.App.showNotification(
                `User ${existingUserIndex >= 0 ? 'updated' : 'added'} successfully!`, 
                'success'
            );
            
        } catch (error) {
            console.error('Error saving user:', error);
            window.App.showNotification('Error saving user: ' + error.message, 'error');
        } finally {
            // Reset button
            const saveBtn = document.getElementById('save-user-btn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save User';
            }
        }
    }
    
    /**
     * Save user locally (fallback)
     */
    saveUserLocally(user) {
        const users = JSON.parse(localStorage.getItem('pms_users') || '[]');
        const existingIndex = users.findIndex(u => u.emp_code === user.emp_code);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem('pms_users', JSON.stringify(users));
    }
    
    /**
     * Validate user data
     */
    validateUserData(userData) {
        const errors = [];
        
        if (!userData['user-emp-code'] || userData['user-emp-code'].trim().length === 0) {
            errors.push('Employee code is required');
        }
        
        if (!userData['user-name'] || userData['user-name'].trim().length === 0) {
            errors.push('Full name is required');
        }
        
        if (!userData['user-department']) {
            errors.push('Department is required');
        }
        
        if (!userData['user-division']) {
            errors.push('Division is required');
        }
        
        if (!userData['user-location']) {
            errors.push('Location is required');
        }
        
        if (!userData['user-role']) {
            errors.push('User role is required');
        }
        
        if (userData['user-email'] && !this.isValidEmail(userData['user-email'])) {
            errors.push('Please enter a valid email address');
        }
        
        return errors;
    }
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Edit user
     */
    editUser(empCode) {
        const user = this.users.find(u => u.emp_code === empCode);
        if (user) {
            this.showUserModal(user);
        }
    }
    
    /**
     * Delete user
     */
    async deleteUser(empCode) {
        const user = this.users.find(u => u.emp_code === empCode);
        if (!user) return;
        
        const confirmed = confirm(`Are you sure you want to delete user "${user.name}" (${empCode})?`);
        if (!confirmed) return;
        
        try {
            // Delete from backend
            await window.DataHandler.deleteUser?.(empCode) || this.deleteUserLocally(empCode);
            
            // Remove from local array
            this.users = this.users.filter(u => u.emp_code !== empCode);
            
            // Update UI
            this.refreshUsersTable();
            
            window.App.showNotification('User deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting user:', error);
            window.App.showNotification('Error deleting user: ' + error.message, 'error');
        }
    }
    
    /**
     * Delete user locally (fallback)
     */
    deleteUserLocally(empCode) {
        const users = JSON.parse(localStorage.getItem('pms_users') || '[]');
        const filteredUsers = users.filter(u => u.emp_code !== empCode);
        localStorage.setItem('pms_users', JSON.stringify(filteredUsers));
    }
    
    /**
     * Filter users based on search criteria
     */
    filterUsers() {
        const roleFilter = document.getElementById('role-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const departmentFilter = document.getElementById('department-filter')?.value || '';
        const searchTerm = document.getElementById('search-users')?.value.toLowerCase() || '';
        
        let filteredUsers = this.users;
        
        if (roleFilter) {
            filteredUsers = filteredUsers.filter(u => u.user_type === roleFilter);
        }
        
        if (statusFilter) {
            filteredUsers = filteredUsers.filter(u => u.status === statusFilter);
        }
        
        if (departmentFilter) {
            filteredUsers = filteredUsers.filter(u => u.department === departmentFilter);
        }
        
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(u => 
                u.name.toLowerCase().includes(searchTerm) ||
                u.emp_code.toLowerCase().includes(searchTerm) ||
                u.email?.toLowerCase().includes(searchTerm)
            );
        }
        
        this.updateUsersTable(filteredUsers);
    }
    
    /**
     * Update users table with filtered data
     */
    updateUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        const showingCount = document.getElementById('showing-count');
        const totalCount = document.getElementById('total-count');
        
        if (tbody) {
            tbody.innerHTML = users.map(user => `
                <tr data-user-id="${user.emp_code}">
                    <td>
                        <div class="user-code">
                            <strong>${user.emp_code}</strong>
                        </div>
                    </td>
                    <td>
                        <div class="user-info">
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email || 'No email'}</div>
                        </div>
                    </td>
                    <td>
                        <div class="role-badge" style="background-color: ${this.roles[user.user_type]?.color}20; color: ${this.roles[user.user_type]?.color}">
                            ${this.roles[user.user_type]?.name || user.user_type}
                        </div>
                    </td>
                    <td>${user.department}</td>
                    <td>${user.division}</td>
                    <td>
                        <span class="status-badge status-${user.status}">
                            ${user.status === 'active' ? '✅ Active' : '❌ Inactive'}
                        </span>
                    </td>
                    <td>
                        <div class="last-login">
                            ${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline edit-user-btn" data-user-id="${user.emp_code}">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-error delete-user-btn" data-user-id="${user.emp_code}">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Re-bind events for new buttons
            this.bindTableEvents();
        }
        
        if (showingCount) showingCount.textContent = users.length;
        if (totalCount) totalCount.textContent = this.users.length;
    }
    
    /**
     * Refresh users table
     */
    refreshUsersTable() {
        this.filterUsers();
        
        // Update stats
        const statsContainer = document.querySelector('.stats-cards');
        if (statsContainer) {
            statsContainer.innerHTML = this.getStatsHTML().match(/<div class="stats-cards">(.*?)<\/div>/s)[1];
        }
    }
    
    /**
     * Bind table events
     */
    bindTableEvents() {
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.editUser(userId);
            });
        });
        
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.deleteUser(userId);
            });
        });
    }
    
    /**
     * Show bulk import modal
     */
    showBulkImportModal() {
        const modal = document.getElementById('bulk-import-modal');
        modal.classList.remove('hidden');
    }
    
    /**
     * Hide bulk import modal
     */
    hideBulkImportModal() {
        const modal = document.getElementById('bulk-import-modal');
        modal.classList.add('hidden');
        
        // Reset form
        const form = document.getElementById('bulk-import-form');
        if (form) form.reset();
        
        // Hide preview
        const preview = document.getElementById('import-preview');
        if (preview) preview.classList.add('hidden');
    }
    
    /**
     * Download CSV template
     */
    downloadTemplate() {
        const template = [
            ['emp_code', 'name', 'email', 'designation', 'department', 'division', 'location', 'user_type', 'status'],
            ['EMP001', 'John Doe', 'john.doe@company.com', 'Senior Executive', 'Finance', 'Corporate', 'Head Office', 'individual_user', 'active'],
            ['EMP002', 'Jane Smith', 'jane.smith@company.com', 'Manager', 'Sales', 'Regional North', 'Branch Office 1', 'approval_manager1', 'active']
        ];
        
        const csvContent = template.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'user_import_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Preview import data
     */
    previewImport(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim());
                const rows = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });
                
                this.showImportPreview(rows);
                
            } catch (error) {
                window.App.showNotification('Error reading CSV file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Show import preview
     */
    showImportPreview(data) {
        const preview = document.getElementById('import-preview');
        const stats = document.getElementById('preview-stats');
        const table = document.getElementById('preview-table');
        
        if (!preview || !stats || !table) return;
        
        const validRows = data.filter(row => row.emp_code && row.name);
        const duplicates = data.filter(row => 
            this.users.some(u => u.emp_code === row.emp_code)
        );
        
        stats.innerHTML = `
            <div class="preview-stat">
                <strong>Total Rows:</strong> ${data.length}
            </div>
            <div class="preview-stat">
                <strong>Valid Rows:</strong> ${validRows.length}
            </div>
            <div class="preview-stat">
                <strong>Duplicates:</strong> ${duplicates.length}
            </div>
            <div class="preview-stat">
                <strong>Will Import:</strong> ${validRows.length - (document.getElementById('skip-duplicates')?.checked ? duplicates.length : 0)}
            </div>
        `;
        
        table.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Employee Code</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 10).map(row => `
                        <tr class="${!row.emp_code || !row.name ? 'invalid-row' : ''}">
                            <td>${row.emp_code || 'Missing'}</td>
                            <td>${row.name || 'Missing'}</td>
                            <td>${row.department || 'Missing'}</td>
                            <td>${row.user_type || 'Missing'}</td>
                            <td>${row.status || 'active'}</td>
                        </tr>
                    `).join('')}
                    ${data.length > 10 ? `
                        <tr>
                            <td colspan="5" class="text-center text-muted">
                                ... and ${data.length - 10} more rows
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        `;
        
        preview.classList.remove('hidden');
        this.importData = data;
    }
    
    /**
     * Process bulk import
     */
    async processBulkImport() {
        if (!this.importData) {
            window.App.showNotification('Please select a file to import', 'error');
            return;
        }
        
        try {
            const skipDuplicates = document.getElementById('skip-duplicates')?.checked;
            const validateData = document.getElementById('validate-data')?.checked;
            
            let processedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            
            for (const row of this.importData) {
                try {
                    // Validate required fields
                    if (!row.emp_code || !row.name) {
                        errorCount++;
                        continue;
                    }
                    
                    // Check for duplicates
                    if (skipDuplicates && this.users.some(u => u.emp_code === row.emp_code)) {
                        skippedCount++;
                        continue;
                    }
                    
                    // Create user object
                    const user = {
                        emp_code: row.emp_code,
                        name: row.name,
                        email: row.email || '',
                        designation: row.designation || '',
                        department: row.department || 'Not Specified',
                        division: row.division || 'Not Specified',
                        location: row.location || 'Not Specified',
                        user_type: row.user_type || 'individual_user',
                        status: row.status || 'active',
                        created_date: new Date().toISOString().split('T')[0],
                        last_login: null
                    };
                    
                    // Validate data if requested
                    if (validateData) {
                        const errors = this.validateUserData({
                            'user-emp-code': user.emp_code,
                            'user-name': user.name,
                            'user-email': user.email,
                            'user-department': user.department,
                            'user-division': user.division,
                            'user-location': user.location,
                            'user-role': user.user_type
                        });
                        
                        if (errors.length > 0) {
                            errorCount++;
                            continue;
                        }
                    }
                    
                    // Save user
                    await window.DataHandler.saveUser?.(user) || this.saveUserLocally(user);
                    
                    // Add to local array
                    const existingIndex = this.users.findIndex(u => u.emp_code === user.emp_code);
                    if (existingIndex >= 0) {
                        this.users[existingIndex] = user;
                    } else {
                        this.users.push(user);
                    }
                    
                    processedCount++;
                    
                } catch (error) {
                    console.error('Error processing row:', error);
                    errorCount++;
                }
            }
            
            // Show results
            window.App.showNotification(
                `Import completed!\nProcessed: ${processedCount}\nSkipped: ${skippedCount}\nErrors: ${errorCount}`,
                processedCount > 0 ? 'success' : 'warning'
            );
            
            // Update UI
            this.refreshUsersTable();
            this.hideBulkImportModal();
            
        } catch (error) {
            console.error('Error processing bulk import:', error);
            window.App.showNotification('Error processing import: ' + error.message, 'error');
        }
    }
    
    /**
     * Export users data
     */
    exportUsers(format = 'csv') {
        const data = this.users.map(user => ({
            'Employee Code': user.emp_code,
            'Name': user.name,
            'Email': user.email || '',
            'Designation': user.designation || '',
            'Department': user.department,
            'Division': user.division,
            'Location': user.location,
            'Role': this.roles[user.user_type]?.name || user.user_type,
            'Status': user.status,
            'Created Date': user.created_date,
            'Last Login': user.last_login || 'Never'
        }));
        
        switch (format) {
            case 'csv':
                window.DataHandler.exportToCSV(data, 'users_export.csv');
                break;
            case 'json':
                this.downloadJSON(this.users, 'users_export.json');
                break;
        }
    }
    
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize global instance
window.UserRolesManager = new UserRolesManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserRolesManager;
}