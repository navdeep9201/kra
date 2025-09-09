/**
 * KRA_KPI_Setting.js - SMART Goals Management Module
 * Handles KRA (Key Result Areas) and KPI (Key Performance Indicators) setting
 * Active during August-September window
 */

class KRAKPIManager {
    constructor() {
        this.currentGoals = [];
        this.maxGoals = 5;
        this.minGoals = 4;
        this.minKPIsPerGoal = 2;
        this.maxKPIsPerGoal = 3;
        this.minWeightagePerGoal = 4;
        this.maxTotalWeightage = 100;
        this.isWindowActive = false;
        this.isReadOnly = false;
        
        // Goal templates for quick start
        this.goalTemplates = [
            {
                category: 'Performance',
                templates: [
                    'Achieve sales target of X% increase',
                    'Improve customer satisfaction score to X%',
                    'Complete project delivery within timeline'
                ]
            },
            {
                category: 'Development',
                templates: [
                    'Complete professional certification in X',
                    'Develop new skill in X technology/area',
                    'Mentor X junior team members'
                ]
            },
            {
                category: 'Process Improvement',
                templates: [
                    'Implement process improvement saving X hours',
                    'Reduce error rate by X%',
                    'Automate X manual processes'
                ]
            }
        ];
        
        this.init();
    }
    
    /**
     * Initialize KRA/KPI module
     */
    init() {
        this.bindEvents();
        this.checkWindowStatus();
    }
    
    /**
     * Check if KRA/KPI setting window is active
     */
    async checkWindowStatus() {
        try {
            const timeWindow = await window.DataHandler.getActiveTimeWindow();
            this.isWindowActive = timeWindow.kraKpiWindow?.active || false;
            this.isReadOnly = timeWindow.kraKpiWindow?.readOnly || false;
            
            this.updateWindowStatus();
        } catch (error) {
            console.error('Error checking window status:', error);
            // Default to inactive if can't determine
            this.isWindowActive = false;
            this.updateWindowStatus();
        }
    }
    
    /**
     * Update UI based on window status
     */
    updateWindowStatus() {
        const statusIndicator = document.querySelector('#kra-window-status .status-indicator');
        const statusText = document.querySelector('#kra-window-status .status-text');
        
        if (statusIndicator && statusText) {
            if (this.isWindowActive && !this.isReadOnly) {
                statusIndicator.className = 'status-indicator active';
                statusText.textContent = 'Active - You can set your KRA & KPIs';
            } else if (this.isReadOnly) {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Read Only - KRA & KPI setting period has ended';
            } else {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Inactive - KRA & KPI setting window is closed';
            }
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab activation
        document.addEventListener('tab-activated', (e) => {
            if (e.detail.tabId === 'kra-kpi-setting') {
                this.loadContent();
            }
        });
        
        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'kra-kpi-form') {
                e.preventDefault();
                this.saveGoals();
            }
        });
        
        // Dynamic form events will be bound after content load
    }
    
    /**
     * Load KRA/KPI content
     */
    async loadContent() {
        const contentDiv = document.querySelector('#kra-kpi-content');
        if (!contentDiv) return;
        
        try {
            // Show loading
            contentDiv.innerHTML = this.getLoadingHTML();
            
            // Load existing goals
            const currentUser = window.AuthManager.getCurrentUser();
            if (currentUser) {
                this.currentGoals = await window.DataHandler.getGoals(currentUser.emp_code) || [];
            }
            
            // Render content
            contentDiv.innerHTML = this.getContentHTML();
            
            // Bind dynamic events
            this.bindDynamicEvents();
            
            // Populate existing data
            this.populateExistingData();
            
            // Update weightage calculation
            this.updateWeightageCalculation();
            
        } catch (error) {
            console.error('Error loading KRA/KPI content:', error);
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
                <p>Loading KRA & KPI settings...</p>
            </div>
        `;
    }
    
    /**
     * Get error HTML
     */
    getErrorHTML(message) {
        return `
            <div class="alert alert-error">
                <h4>Error Loading KRA & KPI Settings</h4>
                <p>${message}</p>
                <button class="btn btn-primary mt-4" onclick="window.KRAKPIManager.loadContent()">
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
            <div class="kra-kpi-container">
                ${this.getInstructionsHTML()}
                ${this.getTemplatesHTML()}
                ${this.getFormHTML()}
                ${this.getSummaryHTML()}
            </div>
        `;
    }
    
    /**
     * Get instructions HTML
     */
    getInstructionsHTML() {
        return `
            <div class="card mb-6">
                <h4>KRA & KPI Setting Instructions</h4>
                <div class="instructions-grid">
                    <div class="instruction-item">
                        <div class="instruction-icon">📋</div>
                        <div>
                            <h5>SMART Goals</h5>
                            <p>Set 4-5 Key Result Areas (KRAs) following SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🎯</div>
                        <div>
                            <h5>KPIs per KRA</h5>
                            <p>Define 2-3 Key Performance Indicators for each KRA with clear measurement criteria</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">⚖️</div>
                        <div>
                            <h5>Weightage</h5>
                            <p>Assign minimum 4% weightage per KRA. Total weightage should not exceed 100%</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">📅</div>
                        <div>
                            <h5>Timeline</h5>
                            <p>KRA & KPI setting is available during August-September window only</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get templates HTML
     */
    getTemplatesHTML() {
        if (this.isReadOnly || !this.isWindowActive) return '';
        
        return `
            <div class="card mb-6">
                <h4>Goal Templates <span class="text-muted">(Click to use)</span></h4>
                <div class="templates-container">
                    ${this.goalTemplates.map(category => `
                        <div class="template-category">
                            <h5>${category.category}</h5>
                            <div class="template-list">
                                ${category.templates.map(template => `
                                    <button type="button" class="template-btn" data-template="${template}">
                                        ${template}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Get form HTML
     */
    getFormHTML() {
        const isDisabled = this.isReadOnly || !this.isWindowActive;
        
        return `
            <form id="kra-kpi-form" class="kra-kpi-form">
                <div class="form-header">
                    <h4>Your SMART Goals & KPIs</h4>
                    ${!isDisabled ? `
                        <div class="form-actions">
                            <button type="button" id="add-goal-btn" class="btn btn-outline">
                                + Add Goal
                            </button>
                            <button type="button" id="auto-save-toggle" class="btn btn-sm btn-secondary">
                                Auto-save: ON
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div id="goals-container" class="goals-container">
                    <!-- Goals will be dynamically added here -->
                </div>
                
                <div class="weightage-summary">
                    <div class="weightage-bar">
                        <div class="weightage-progress" id="weightage-progress"></div>
                    </div>
                    <div class="weightage-text">
                        <span>Total Weightage: </span>
                        <span id="total-weightage" class="font-bold">0%</span>
                        <span> / 100%</span>
                    </div>
                </div>
                
                ${!isDisabled ? `
                    <div class="form-footer">
                        <div class="form-actions">
                            <button type="button" id="save-draft-btn" class="btn btn-secondary">
                                Save as Draft
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Save Goals
                            </button>
                        </div>
                        <p class="text-muted text-sm">
                            Your goals will be locked after the KRA & KPI setting window closes.
                        </p>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        <p>KRA & KPI setting period has ended. Goals are now read-only.</p>
                    </div>
                `}
            </form>
        `;
    }
    
    /**
     * Get summary HTML
     */
    getSummaryHTML() {
        return `
            <div class="card">
                <h4>Goals Summary</h4>
                <div id="goals-summary" class="goals-summary">
                    <!-- Summary will be populated dynamically -->
                </div>
            </div>
        `;
    }
    
    /**
     * Bind dynamic events
     */
    bindDynamicEvents() {
        // Add goal button
        const addGoalBtn = document.querySelector('#add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.addGoal());
        }
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                this.useTemplate(template);
            });
        });
        
        // Auto-save toggle
        const autoSaveToggle = document.querySelector('#auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('click', () => this.toggleAutoSave());
        }
        
        // Save draft button
        const saveDraftBtn = document.querySelector('#save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }
        
        // Auto-save on input changes
        if (!this.isReadOnly && this.isWindowActive) {
            document.addEventListener('input', (e) => {
                if (e.target.closest('#kra-kpi-form')) {
                    this.scheduleAutoSave();
                }
            });
        }
    }
    
    /**
     * Add new goal
     */
    addGoal() {
        if (this.currentGoals.length >= this.maxGoals) {
            window.App.showNotification(`Maximum ${this.maxGoals} goals allowed`, 'warning');
            return;
        }
        
        const goalId = Date.now();
        const newGoal = {
            id: goalId,
            kra_title: '',
            kpis: [
                { id: Date.now() + 1, description: '', measurement_criteria: '' },
                { id: Date.now() + 2, description: '', measurement_criteria: '' }
            ],
            weightage: this.minWeightagePerGoal,
            created_at: new Date().toISOString()
        };
        
        this.currentGoals.push(newGoal);
        this.renderGoals();
        this.updateWeightageCalculation();
        this.updateSummary();
        
        // Focus on the new goal title
        setTimeout(() => {
            const newGoalInput = document.querySelector(`[data-goal-id="${goalId}"] .kra-title-input`);
            if (newGoalInput) newGoalInput.focus();
        }, 100);
    }
    
    /**
     * Remove goal
     */
    removeGoal(goalId) {
        if (this.currentGoals.length <= this.minGoals) {
            window.App.showNotification(`Minimum ${this.minGoals} goals required`, 'warning');
            return;
        }
        
        this.currentGoals = this.currentGoals.filter(goal => goal.id !== goalId);
        this.renderGoals();
        this.updateWeightageCalculation();
        this.updateSummary();
    }
    
    /**
     * Add KPI to goal
     */
    addKPI(goalId) {
        const goal = this.currentGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        if (goal.kpis.length >= this.maxKPIsPerGoal) {
            window.App.showNotification(`Maximum ${this.maxKPIsPerGoal} KPIs per goal allowed`, 'warning');
            return;
        }
        
        goal.kpis.push({
            id: Date.now(),
            description: '',
            measurement_criteria: ''
        });
        
        this.renderGoals();
    }
    
    /**
     * Remove KPI from goal
     */
    removeKPI(goalId, kpiId) {
        const goal = this.currentGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        if (goal.kpis.length <= this.minKPIsPerGoal) {
            window.App.showNotification(`Minimum ${this.minKPIsPerGoal} KPIs per goal required`, 'warning');
            return;
        }
        
        goal.kpis = goal.kpis.filter(kpi => kpi.id !== kpiId);
        this.renderGoals();
    }
    
    /**
     * Use template for new goal
     */
    useTemplate(template) {
        const emptyGoal = this.currentGoals.find(goal => !goal.kra_title.trim());
        if (emptyGoal) {
            emptyGoal.kra_title = template;
            this.renderGoals();
        } else if (this.currentGoals.length < this.maxGoals) {
            this.addGoal();
            setTimeout(() => {
                const lastGoal = this.currentGoals[this.currentGoals.length - 1];
                lastGoal.kra_title = template;
                this.renderGoals();
            }, 100);
        } else {
            window.App.showNotification('All goal slots are filled', 'info');
        }
    }
    
    /**
     * Render goals in the form
     */
    renderGoals() {
        const container = document.querySelector('#goals-container');
        if (!container) return;
        
        container.innerHTML = this.currentGoals.map((goal, index) => 
            this.getGoalHTML(goal, index)
        ).join('');
        
        // Bind goal-specific events
        this.bindGoalEvents();
    }
    
    /**
     * Get HTML for a single goal
     */
    getGoalHTML(goal, index) {
        const isDisabled = this.isReadOnly || !this.isWindowActive;
        
        return `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <h5>SMART Goal ${index + 1}</h5>
                    ${!isDisabled && this.currentGoals.length > this.minGoals ? `
                        <button type="button" class="btn btn-sm btn-error remove-goal-btn" data-goal-id="${goal.id}">
                            Remove
                        </button>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label class="required">Key Result Area (KRA)</label>
                    <textarea 
                        class="form-control kra-title-input" 
                        placeholder="Enter your SMART goal description..."
                        ${isDisabled ? 'disabled' : ''}
                        data-goal-id="${goal.id}"
                        data-field="kra_title"
                    >${goal.kra_title}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Weightage (%)</label>
                    <div class="input-group">
                        <input 
                            type="number" 
                            class="form-control weightage-input" 
                            min="${this.minWeightagePerGoal}" 
                            max="100" 
                            value="${goal.weightage}"
                            ${isDisabled ? 'disabled' : ''}
                            data-goal-id="${goal.id}"
                            data-field="weightage"
                        >
                        <span class="input-group-text">%</span>
                    </div>
                </div>
                
                <div class="kpis-section">
                    <div class="kpis-header">
                        <h6>Key Performance Indicators (KPIs)</h6>
                        ${!isDisabled && goal.kpis.length < this.maxKPIsPerGoal ? `
                            <button type="button" class="btn btn-sm btn-outline add-kpi-btn" data-goal-id="${goal.id}">
                                + Add KPI
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="kpis-list">
                        ${goal.kpis.map((kpi, kpiIndex) => this.getKPIHTML(goal.id, kpi, kpiIndex, isDisabled)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get HTML for a single KPI
     */
    getKPIHTML(goalId, kpi, index, isDisabled) {
        return `
            <div class="kpi-item" data-kpi-id="${kpi.id}">
                <div class="kpi-header">
                    <span class="kpi-number">KPI ${index + 1}</span>
                    ${!isDisabled && this.currentGoals.find(g => g.id === goalId).kpis.length > this.minKPIsPerGoal ? `
                        <button type="button" class="btn btn-sm btn-error remove-kpi-btn" 
                                data-goal-id="${goalId}" data-kpi-id="${kpi.id}">
                            Remove
                        </button>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label>KPI Description</label>
                    <input 
                        type="text" 
                        class="form-control kpi-description-input" 
                        placeholder="What will you measure?"
                        value="${kpi.description}"
                        ${isDisabled ? 'disabled' : ''}
                        data-goal-id="${goalId}"
                        data-kpi-id="${kpi.id}"
                        data-field="description"
                    >
                </div>
                
                <div class="form-group">
                    <label>Measurement Criteria (at 100% level)</label>
                    <input 
                        type="text" 
                        class="form-control kpi-criteria-input" 
                        placeholder="How will you measure success at 100%?"
                        value="${kpi.measurement_criteria}"
                        ${isDisabled ? 'disabled' : ''}
                        data-goal-id="${goalId}"
                        data-kpi-id="${kpi.id}"
                        data-field="measurement_criteria"
                    >
                </div>
            </div>
        `;
    }
    
    /**
     * Bind goal-specific events
     */
    bindGoalEvents() {
        // Remove goal buttons
        document.querySelectorAll('.remove-goal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.dataset.goalId);
                this.removeGoal(goalId);
            });
        });
        
        // Add KPI buttons
        document.querySelectorAll('.add-kpi-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.dataset.goalId);
                this.addKPI(goalId);
            });
        });
        
        // Remove KPI buttons
        document.querySelectorAll('.remove-kpi-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.dataset.goalId);
                const kpiId = parseInt(e.target.dataset.kpiId);
                this.removeKPI(goalId, kpiId);
            });
        });
        
        // Input change handlers
        document.querySelectorAll('.kra-title-input, .weightage-input, .kpi-description-input, .kpi-criteria-input').forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
            input.addEventListener('blur', (e) => this.handleInputBlur(e));
        });
    }
    
    /**
     * Handle input changes
     */
    handleInputChange(e) {
        const goalId = parseInt(e.target.dataset.goalId);
        const kpiId = e.target.dataset.kpiId ? parseInt(e.target.dataset.kpiId) : null;
        const field = e.target.dataset.field;
        const value = e.target.value;
        
        const goal = this.currentGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        if (kpiId) {
            const kpi = goal.kpis.find(k => k.id === kpiId);
            if (kpi) {
                kpi[field] = value;
            }
        } else {
            goal[field] = field === 'weightage' ? parseInt(value) || 0 : value;
            if (field === 'weightage') {
                this.updateWeightageCalculation();
            }
        }
        
        this.updateSummary();
    }
    
    /**
     * Handle input blur (validation)
     */
    handleInputBlur(e) {
        const field = e.target.dataset.field;
        
        if (field === 'weightage') {
            const value = parseInt(e.target.value) || 0;
            if (value < this.minWeightagePerGoal) {
                e.target.value = this.minWeightagePerGoal;
                this.handleInputChange(e);
                window.App.showNotification(`Minimum weightage is ${this.minWeightagePerGoal}%`, 'warning');
            }
        }
    }
    
    /**
     * Update weightage calculation display
     */
    updateWeightageCalculation() {
        const totalWeightage = this.currentGoals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
        
        const totalElement = document.querySelector('#total-weightage');
        const progressElement = document.querySelector('#weightage-progress');
        
        if (totalElement) {
            totalElement.textContent = `${totalWeightage}%`;
            totalElement.className = totalWeightage > 100 ? 'font-bold text-error' : 'font-bold text-success';
        }
        
        if (progressElement) {
            const percentage = Math.min(totalWeightage, 100);
            progressElement.style.width = `${percentage}%`;
            progressElement.className = totalWeightage > 100 ? 'weightage-progress error' : 'weightage-progress';
        }
    }
    
    /**
     * Update goals summary
     */
    updateSummary() {
        const summaryElement = document.querySelector('#goals-summary');
        if (!summaryElement) return;
        
        const totalWeightage = this.currentGoals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
        const completedGoals = this.currentGoals.filter(goal => 
            goal.kra_title.trim() && 
            goal.kpis.every(kpi => kpi.description.trim() && kpi.measurement_criteria.trim())
        ).length;
        
        summaryElement.innerHTML = `
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="stat-value">${this.currentGoals.length}</div>
                    <div class="stat-label">Goals Defined</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${completedGoals}</div>
                    <div class="stat-label">Goals Completed</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value ${totalWeightage > 100 ? 'text-error' : 'text-success'}">${totalWeightage}%</div>
                    <div class="stat-label">Total Weightage</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-value">${this.currentGoals.reduce((sum, goal) => sum + goal.kpis.length, 0)}</div>
                    <div class="stat-label">Total KPIs</div>
                </div>
            </div>
            
            ${this.currentGoals.length > 0 ? `
                <div class="goals-list-summary">
                    ${this.currentGoals.map((goal, index) => `
                        <div class="goal-summary-item">
                            <div class="goal-summary-header">
                                <span class="goal-number">Goal ${index + 1}</span>
                                <span class="goal-weightage">${goal.weightage}%</span>
                            </div>
                            <div class="goal-summary-title">${goal.kra_title || 'Untitled Goal'}</div>
                            <div class="goal-summary-kpis">${goal.kpis.length} KPIs defined</div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">🎯</div>
                    <h3>No Goals Defined Yet</h3>
                    <p>Click "Add Goal" to start setting your SMART goals and KPIs</p>
                </div>
            `}
        `;
    }
    
    /**
     * Populate existing data
     */
    populateExistingData() {
        if (this.currentGoals.length === 0) {
            // Add minimum required goals if none exist
            for (let i = 0; i < this.minGoals; i++) {
                this.addGoal();
            }
        } else {
            this.renderGoals();
        }
    }
    
    /**
     * Validate goals data
     */
    validateGoals() {
        const errors = [];
        
        // Check goal count
        if (this.currentGoals.length < this.minGoals) {
            errors.push(`Minimum ${this.minGoals} goals required`);
        }
        
        if (this.currentGoals.length > this.maxGoals) {
            errors.push(`Maximum ${this.maxGoals} goals allowed`);
        }
        
        // Check total weightage
        const totalWeightage = this.currentGoals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
        if (totalWeightage > this.maxTotalWeightage) {
            errors.push(`Total weightage cannot exceed ${this.maxTotalWeightage}%`);
        }
        
        // Validate each goal
        this.currentGoals.forEach((goal, index) => {
            const goalNumber = index + 1;
            
            // Check KRA title
            if (!goal.kra_title || goal.kra_title.trim().length === 0) {
                errors.push(`Goal ${goalNumber}: KRA title is required`);
            }
            
            // Check weightage
            if (!goal.weightage || goal.weightage < this.minWeightagePerGoal) {
                errors.push(`Goal ${goalNumber}: Minimum weightage is ${this.minWeightagePerGoal}%`);
            }
            
            // Check KPI count
            if (goal.kpis.length < this.minKPIsPerGoal) {
                errors.push(`Goal ${goalNumber}: Minimum ${this.minKPIsPerGoal} KPIs required`);
            }
            
            if (goal.kpis.length > this.maxKPIsPerGoal) {
                errors.push(`Goal ${goalNumber}: Maximum ${this.maxKPIsPerGoal} KPIs allowed`);
            }
            
            // Validate each KPI
            goal.kpis.forEach((kpi, kpiIndex) => {
                const kpiNumber = kpiIndex + 1;
                
                if (!kpi.description || kpi.description.trim().length === 0) {
                    errors.push(`Goal ${goalNumber}, KPI ${kpiNumber}: Description is required`);
                }
                
                if (!kpi.measurement_criteria || kpi.measurement_criteria.trim().length === 0) {
                    errors.push(`Goal ${goalNumber}, KPI ${kpiNumber}: Measurement criteria is required`);
                }
            });
        });
        
        return errors;
    }
    
    /**
     * Save goals
     */
    async saveGoals() {
        try {
            // Validate data
            const errors = this.validateGoals();
            if (errors.length > 0) {
                window.App.showNotification('Please fix the following errors:\n' + errors.join('\n'), 'error');
                return;
            }
            
            // Show loading
            const submitBtn = document.querySelector('#kra-kpi-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
            }
            
            // Save to backend
            const currentUser = window.AuthManager.getCurrentUser();
            await window.DataHandler.saveGoals(currentUser.emp_code, this.currentGoals);
            
            window.App.showNotification('Goals saved successfully!', 'success');
            
            // Update summary
            this.updateSummary();
            
        } catch (error) {
            console.error('Error saving goals:', error);
            window.App.showNotification('Error saving goals: ' + error.message, 'error');
        } finally {
            // Reset button
            const submitBtn = document.querySelector('#kra-kpi-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Goals';
            }
        }
    }
    
    /**
     * Save draft
     */
    async saveDraft() {
        try {
            const currentUser = window.AuthManager.getCurrentUser();
            
            // Add draft flag to goals
            const draftGoals = this.currentGoals.map(goal => ({
                ...goal,
                isDraft: true,
                lastSaved: new Date().toISOString()
            }));
            
            await window.DataHandler.saveGoals(currentUser.emp_code, draftGoals);
            window.App.showNotification('Draft saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving draft:', error);
            window.App.showNotification('Error saving draft: ' + error.message, 'error');
        }
    }
    
    /**
     * Auto-save functionality
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft();
        }, 30000); // Auto-save after 30 seconds of inactivity
    }
    
    toggleAutoSave() {
        this.autoSaveEnabled = !this.autoSaveEnabled;
        const toggleBtn = document.querySelector('#auto-save-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = `Auto-save: ${this.autoSaveEnabled ? 'ON' : 'OFF'}`;
            toggleBtn.className = `btn btn-sm ${this.autoSaveEnabled ? 'btn-success' : 'btn-secondary'}`;
        }
        
        if (!this.autoSaveEnabled && this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
    }
    
    /**
     * Export goals to different formats
     */
    exportGoals(format = 'pdf') {
        const data = {
            employee: window.AuthManager.getCurrentUser(),
            goals: this.currentGoals,
            timestamp: new Date().toISOString(),
            totalWeightage: this.currentGoals.reduce((sum, goal) => sum + (goal.weightage || 0), 0)
        };
        
        switch (format) {
            case 'json':
                this.downloadJSON(data, 'kra-kpi-goals.json');
                break;
            case 'csv':
                this.exportToCSV();
                break;
            case 'pdf':
                this.generatePDF(data);
                break;
        }
    }
    
    exportToCSV() {
        const csvData = [];
        
        this.currentGoals.forEach((goal, goalIndex) => {
            goal.kpis.forEach((kpi, kpiIndex) => {
                csvData.push({
                    'Goal Number': goalIndex + 1,
                    'KRA Title': goal.kra_title,
                    'Weightage (%)': goal.weightage,
                    'KPI Number': kpiIndex + 1,
                    'KPI Description': kpi.description,
                    'Measurement Criteria': kpi.measurement_criteria
                });
            });
        });
        
        window.DataHandler.exportToCSV(csvData, 'kra-kpi-goals.csv');
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
    
    generatePDF(data) {
        // This would integrate with a PDF generation library
        console.log('PDF generation would be implemented here', data);
        window.App.showNotification('PDF export functionality will be available soon', 'info');
    }
}

// Initialize global instance
window.KRAKPIManager = new KRAKPIManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KRAKPIManager;
}