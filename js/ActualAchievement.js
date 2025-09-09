/**
 * ActualAchievement.js - Actual Achievement Tracking Module
 * Handles mid-year review and final achievement ratio tracking
 * Active during November-December (mid-year) and Year-end windows
 */

class ActualAchievementManager {
    constructor() {
        this.currentGoals = [];
        this.achievementData = {};
        this.isWindowActive = false;
        this.currentWindow = null; // 'mid_year' or 'year_end'
        this.isReadOnly = false;
        
        // Achievement options
        this.midYearOptions = [
            { value: 'NS', label: 'Not Started', description: 'Goal not yet initiated' },
            { value: 'BT', label: 'Behind Target', description: 'Progress is below expected level' },
            { value: 'OT', label: 'On Target', description: 'Progress is as expected' },
            { value: 'AT', label: 'Ahead of Target', description: 'Progress exceeds expectations' },
            { value: 'C', label: 'Completed', description: 'Goal has been achieved' }
        ];
        
        this.achievementRatios = [
            { value: 25, label: '25%', description: 'Minimal achievement' },
            { value: 50, label: '50%', description: 'Partial achievement' },
            { value: 75, label: '75%', description: 'Substantial achievement' },
            { value: 100, label: '100%', description: 'Complete achievement' },
            { value: 125, label: '125%', description: 'Exceeded expectations' }
        ];
        
        this.init();
    }
    
    /**
     * Initialize Actual Achievement module
     */
    init() {
        this.bindEvents();
        this.checkWindowStatus();
    }
    
    /**
     * Check if achievement window is active
     */
    async checkWindowStatus() {
        try {
            const timeWindow = await window.DataHandler.getActiveTimeWindow();
            
            // Check which window is active
            if (timeWindow.midYearWindow?.active) {
                this.isWindowActive = true;
                this.currentWindow = 'mid_year';
                this.isReadOnly = timeWindow.midYearWindow.readOnly || false;
            } else if (timeWindow.yearEndWindow?.active) {
                this.isWindowActive = true;
                this.currentWindow = 'year_end';
                this.isReadOnly = timeWindow.yearEndWindow.readOnly || false;
            } else {
                this.isWindowActive = false;
                this.currentWindow = null;
                this.isReadOnly = true;
            }
            
            this.updateWindowStatus();
        } catch (error) {
            console.error('Error checking window status:', error);
            this.isWindowActive = false;
            this.currentWindow = null;
            this.updateWindowStatus();
        }
    }
    
    /**
     * Update UI based on window status
     */
    updateWindowStatus() {
        const statusIndicator = document.querySelector('#achievement-window-status .status-indicator');
        const statusText = document.querySelector('#achievement-window-status .status-text');
        
        if (statusIndicator && statusText) {
            if (this.isWindowActive && !this.isReadOnly) {
                statusIndicator.className = 'status-indicator active';
                if (this.currentWindow === 'mid_year') {
                    statusText.textContent = 'Mid-Year Review Active - Update your progress';
                } else if (this.currentWindow === 'year_end') {
                    statusText.textContent = 'Year-End Review Active - Enter final achievements';
                }
            } else if (this.isReadOnly) {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Read Only - Review period has ended';
            } else {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Inactive - No active review window';
            }
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab activation
        document.addEventListener('tab-activated', (e) => {
            if (e.detail.tabId === 'actual-achievement') {
                this.loadContent();
            }
        });
        
        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'achievement-form') {
                e.preventDefault();
                this.saveAchievements();
            }
        });
    }
    
    /**
     * Load achievement content
     */
    async loadContent() {
        const contentDiv = document.querySelector('#achievement-content');
        if (!contentDiv) return;
        
        try {
            // Show loading
            contentDiv.innerHTML = this.getLoadingHTML();
            
            // Load existing goals and achievements
            const currentUser = window.AuthManager.getCurrentUser();
            if (currentUser) {
                this.currentGoals = await window.DataHandler.getGoals(currentUser.emp_code) || [];
                
                // Load existing achievement data if any
                try {
                    const existingData = await window.DataHandler.getAchievementData?.(currentUser.emp_code) || {};
                    this.achievementData = existingData;
                } catch (error) {
                    console.log('No existing achievement data found');
                    this.achievementData = {};
                }
            }
            
            // Render content
            contentDiv.innerHTML = this.getContentHTML();
            
            // Bind dynamic events
            this.bindDynamicEvents();
            
            // Populate existing data
            this.populateExistingData();
            
            // Calculate totals
            this.calculateTotals();
            
        } catch (error) {
            console.error('Error loading achievement content:', error);
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
                <p>Loading achievement data...</p>
            </div>
        `;
    }
    
    /**
     * Get error HTML
     */
    getErrorHTML(message) {
        return `
            <div class="alert alert-error">
                <h4>Error Loading Achievement Data</h4>
                <p>${message}</p>
                <button class="btn btn-primary mt-4" onclick="window.ActualAchievementManager.loadContent()">
                    Retry
                </button>
            </div>
        `;
    }
    
    /**
     * Get main content HTML
     */
    getContentHTML() {
        if (this.currentGoals.length === 0) {
            return this.getNoGoalsHTML();
        }
        
        return `
            <div class="achievement-container">
                ${this.getInstructionsHTML()}
                ${this.getProgressSummaryHTML()}
                ${this.getAchievementFormHTML()}
                ${this.getCalculationSummaryHTML()}
            </div>
        `;
    }
    
    /**
     * Get no goals HTML
     */
    getNoGoalsHTML() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No Goals Found</h3>
                <p>You need to set your KRA & KPI goals first before tracking achievements.</p>
                <button class="btn btn-primary" onclick="window.App.switchTab('kra-kpi-setting')">
                    Set Goals First
                </button>
            </div>
        `;
    }
    
    /**
     * Get instructions HTML
     */
    getInstructionsHTML() {
        const windowType = this.currentWindow;
        
        return `
            <div class="card mb-6">
                <h4>${windowType === 'mid_year' ? 'Mid-Year Review' : 'Year-End Achievement'} Instructions</h4>
                <div class="instructions-grid">
                    ${windowType === 'mid_year' ? `
                        <div class="instruction-item">
                            <div class="instruction-icon">📊</div>
                            <div>
                                <h5>Progress Review</h5>
                                <p>Review your progress on each KRA and select the appropriate status from the dropdown</p>
                            </div>
                        </div>
                        <div class="instruction-item">
                            <div class="instruction-icon">🎯</div>
                            <div>
                                <h5>Status Options</h5>
                                <p>NS (Not Started), BT (Behind Target), OT (On Target), AT (Ahead of Target), C (Completed)</p>
                            </div>
                        </div>
                    ` : `
                        <div class="instruction-item">
                            <div class="instruction-icon">🏆</div>
                            <div>
                                <h5>Final Achievement</h5>
                                <p>Select your confirmed achievement ratio for each KRA based on actual results</p>
                            </div>
                        </div>
                        <div class="instruction-item">
                            <div class="instruction-icon">📈</div>
                            <div>
                                <h5>Achievement Ratios</h5>
                                <p>Choose from 25%, 50%, 75%, 100%, or 125% based on your actual performance</p>
                            </div>
                        </div>
                    `}
                    <div class="instruction-item">
                        <div class="instruction-icon">⚡</div>
                        <div>
                            <h5>Auto-Calculation</h5>
                            <p>Your weighted scores will be automatically calculated based on your inputs</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">💾</div>
                        <div>
                            <h5>Save Progress</h5>
                            <p>Your progress is auto-saved. Click "Save" to finalize your ${windowType === 'mid_year' ? 'review' : 'achievements'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get progress summary HTML
     */
    getProgressSummaryHTML() {
        return `
            <div class="progress-summary-card">
                <h4>Achievement Progress Overview</h4>
                <div class="progress-stats">
                    <div class="progress-stat">
                        <div class="stat-circle" id="overall-progress">
                            <span class="stat-value">0%</span>
                        </div>
                        <div class="stat-label">Overall Progress</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-number" id="completed-goals">0</div>
                        <div class="stat-label">Goals Reviewed</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-number" id="total-weighted-score">0.0</div>
                        <div class="stat-label">Weighted Score</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-rating" id="performance-rating">
                            <div class="rating-stars">
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                                <span class="star">★</span>
                            </div>
                        </div>
                        <div class="stat-label">Performance Rating</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get achievement form HTML
     */
    getAchievementFormHTML() {
        const isDisabled = this.isReadOnly || !this.isWindowActive;
        const windowType = this.currentWindow;
        
        return `
            <form id="achievement-form" class="achievement-form">
                <div class="form-header">
                    <h4>Your Goal Achievements</h4>
                    ${!isDisabled ? `
                        <div class="form-actions">
                            <button type="button" id="auto-save-toggle" class="btn btn-sm btn-success">
                                Auto-save: ON
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="goals-achievement-list">
                    ${this.currentGoals.map((goal, index) => this.getGoalAchievementHTML(goal, index, windowType, isDisabled)).join('')}
                </div>
                
                ${!isDisabled ? `
                    <div class="form-footer">
                        <div class="form-actions">
                            <button type="button" id="save-draft-btn" class="btn btn-secondary">
                                Save Draft
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Save ${windowType === 'mid_year' ? 'Review' : 'Achievements'}
                            </button>
                        </div>
                        <p class="text-muted text-sm">
                            Your ${windowType === 'mid_year' ? 'review' : 'achievements'} will be locked after the window closes.
                        </p>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        <p>${windowType === 'mid_year' ? 'Mid-year review' : 'Achievement tracking'} period has ended. Data is now read-only.</p>
                    </div>
                `}
            </form>
        `;
    }
    
    /**
     * Get HTML for individual goal achievement
     */
    getGoalAchievementHTML(goal, index, windowType, isDisabled) {
        const goalId = goal.id;
        const achievementData = this.achievementData[goalId] || {};
        
        return `
            <div class="goal-achievement-card" data-goal-id="${goalId}">
                <div class="goal-header">
                    <div class="goal-info">
                        <h5>Goal ${index + 1} <span class="goal-weightage">(${goal.weightage}%)</span></h5>
                        <p class="goal-title">${goal.kra_title}</p>
                    </div>
                    <div class="goal-status">
                        <div class="achievement-badge" id="achievement-badge-${goalId}">
                            ${this.getAchievementBadge(achievementData, windowType)}
                        </div>
                    </div>
                </div>
                
                <div class="kpis-list">
                    <h6>Key Performance Indicators</h6>
                    ${goal.kpis.map((kpi, kpiIndex) => `
                        <div class="kpi-item">
                            <div class="kpi-info">
                                <strong>KPI ${kpiIndex + 1}:</strong> ${kpi.description}
                            </div>
                            <div class="kpi-criteria">
                                <strong>Target:</strong> ${kpi.measurement_criteria}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${windowType === 'mid_year' ? `
                    <div class="mid-year-review">
                        <div class="form-group">
                            <label for="mid-year-${goalId}">Mid-Year Review Status</label>
                            <select 
                                id="mid-year-${goalId}" 
                                class="form-control mid-year-select" 
                                data-goal-id="${goalId}"
                                ${isDisabled ? 'disabled' : ''}
                            >
                                <option value="">Select status...</option>
                                ${this.midYearOptions.map(option => `
                                    <option value="${option.value}" ${achievementData.midYearReview === option.value ? 'selected' : ''}>
                                        ${option.label} - ${option.description}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="mid-year-notes-${goalId}">Progress Notes (Optional)</label>
                            <textarea 
                                id="mid-year-notes-${goalId}" 
                                class="form-control mid-year-notes" 
                                data-goal-id="${goalId}"
                                placeholder="Add any notes about your progress, challenges, or achievements..."
                                rows="3"
                                ${isDisabled ? 'disabled' : ''}
                            >${achievementData.midYearNotes || ''}</textarea>
                        </div>
                    </div>
                ` : ''}
                
                ${windowType === 'year_end' ? `
                    <div class="year-end-achievement">
                        ${achievementData.midYearReview ? `
                            <div class="mid-year-summary">
                                <h6>Mid-Year Review</h6>
                                <div class="review-status">
                                    <span class="status-badge status-${achievementData.midYearReview.toLowerCase()}">
                                        ${this.midYearOptions.find(opt => opt.value === achievementData.midYearReview)?.label || achievementData.midYearReview}
                                    </span>
                                    ${achievementData.midYearNotes ? `
                                        <p class="review-notes">${achievementData.midYearNotes}</p>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label for="achievement-ratio-${goalId}">Confirmed Achievement Ratio</label>
                            <select 
                                id="achievement-ratio-${goalId}" 
                                class="form-control achievement-ratio-select" 
                                data-goal-id="${goalId}"
                                ${isDisabled ? 'disabled' : ''}
                            >
                                <option value="">Select achievement level...</option>
                                ${this.achievementRatios.map(ratio => `
                                    <option value="${ratio.value}" ${achievementData.achievedRatio == ratio.value ? 'selected' : ''}>
                                        ${ratio.label} - ${ratio.description}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="achievement-calculation">
                            <div class="calc-row">
                                <span>Weightage:</span>
                                <span class="calc-value">${goal.weightage}%</span>
                            </div>
                            <div class="calc-row">
                                <span>Achievement Ratio:</span>
                                <span class="calc-value" id="ratio-display-${goalId}">
                                    ${achievementData.achievedRatio || 0}%
                                </span>
                            </div>
                            <div class="calc-row calc-total">
                                <span>Weighted Score:</span>
                                <span class="calc-value" id="weighted-score-${goalId}">
                                    ${this.calculateWeightedScore(goal.weightage, achievementData.achievedRatio || 0)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="achievement-evidence-${goalId}">Achievement Evidence/Notes</label>
                            <textarea 
                                id="achievement-evidence-${goalId}" 
                                class="form-control achievement-evidence" 
                                data-goal-id="${goalId}"
                                placeholder="Provide evidence or detailed notes about your achievement..."
                                rows="4"
                                ${isDisabled ? 'disabled' : ''}
                            >${achievementData.achievementEvidence || ''}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Get calculation summary HTML
     */
    getCalculationSummaryHTML() {
        if (this.currentWindow !== 'year_end') return '';
        
        return `
            <div class="calculation-summary-card">
                <h4>Performance Calculation Summary</h4>
                <div class="summary-table">
                    <div class="summary-header">
                        <div>Goal</div>
                        <div>Weightage</div>
                        <div>Achievement</div>
                        <div>Weighted Score</div>
                    </div>
                    <div id="calculation-breakdown" class="calculation-breakdown">
                        <!-- Will be populated dynamically -->
                    </div>
                    <div class="summary-footer">
                        <div class="total-row">
                            <div>Total Performance Score:</div>
                            <div></div>
                            <div></div>
                            <div id="total-performance-score" class="total-score">0.0</div>
                        </div>
                    </div>
                </div>
                
                <div class="performance-rating-display">
                    <h5>Performance Rating</h5>
                    <div id="final-rating-display" class="final-rating">
                        <div class="rating-medal">🏆</div>
                        <div class="rating-text">Calculating...</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind dynamic events
     */
    bindDynamicEvents() {
        // Mid-year review selects
        document.querySelectorAll('.mid-year-select').forEach(select => {
            select.addEventListener('change', (e) => this.handleMidYearChange(e));
        });
        
        // Mid-year notes
        document.querySelectorAll('.mid-year-notes').forEach(textarea => {
            textarea.addEventListener('input', (e) => this.handleMidYearNotesChange(e));
        });
        
        // Achievement ratio selects
        document.querySelectorAll('.achievement-ratio-select').forEach(select => {
            select.addEventListener('change', (e) => this.handleAchievementRatioChange(e));
        });
        
        // Achievement evidence
        document.querySelectorAll('.achievement-evidence').forEach(textarea => {
            textarea.addEventListener('input', (e) => this.handleAchievementEvidenceChange(e));
        });
        
        // Save draft button
        const saveDraftBtn = document.querySelector('#save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }
        
        // Auto-save toggle
        const autoSaveToggle = document.querySelector('#auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('click', () => this.toggleAutoSave());
        }
        
        // Auto-save on input
        if (!this.isReadOnly && this.isWindowActive) {
            document.addEventListener('input', (e) => {
                if (e.target.closest('#achievement-form')) {
                    this.scheduleAutoSave();
                }
            });
        }
    }
    
    /**
     * Handle mid-year review change
     */
    handleMidYearChange(e) {
        const goalId = parseInt(e.target.dataset.goalId);
        const value = e.target.value;
        
        if (!this.achievementData[goalId]) {
            this.achievementData[goalId] = {};
        }
        
        this.achievementData[goalId].midYearReview = value;
        this.updateGoalBadge(goalId);
        this.updateProgressSummary();
    }
    
    /**
     * Handle mid-year notes change
     */
    handleMidYearNotesChange(e) {
        const goalId = parseInt(e.target.dataset.goalId);
        const value = e.target.value;
        
        if (!this.achievementData[goalId]) {
            this.achievementData[goalId] = {};
        }
        
        this.achievementData[goalId].midYearNotes = value;
    }
    
    /**
     * Handle achievement ratio change
     */
    handleAchievementRatioChange(e) {
        const goalId = parseInt(e.target.dataset.goalId);
        const value = parseInt(e.target.value) || 0;
        
        if (!this.achievementData[goalId]) {
            this.achievementData[goalId] = {};
        }
        
        this.achievementData[goalId].achievedRatio = value;
        
        // Update displays
        this.updateAchievementDisplays(goalId);
        this.updateGoalBadge(goalId);
        this.updateProgressSummary();
        this.calculateTotals();
    }
    
    /**
     * Handle achievement evidence change
     */
    handleAchievementEvidenceChange(e) {
        const goalId = parseInt(e.target.dataset.goalId);
        const value = e.target.value;
        
        if (!this.achievementData[goalId]) {
            this.achievementData[goalId] = {};
        }
        
        this.achievementData[goalId].achievementEvidence = value;
    }
    
    /**
     * Update achievement displays for a goal
     */
    updateAchievementDisplays(goalId) {
        const goal = this.currentGoals.find(g => g.id === goalId);
        const achievementData = this.achievementData[goalId];
        
        if (!goal || !achievementData) return;
        
        // Update ratio display
        const ratioDisplay = document.querySelector(`#ratio-display-${goalId}`);
        if (ratioDisplay) {
            ratioDisplay.textContent = `${achievementData.achievedRatio || 0}%`;
        }
        
        // Update weighted score
        const weightedScoreElement = document.querySelector(`#weighted-score-${goalId}`);
        if (weightedScoreElement) {
            const weightedScore = this.calculateWeightedScore(goal.weightage, achievementData.achievedRatio || 0);
            weightedScoreElement.textContent = weightedScore;
        }
    }
    
    /**
     * Update goal achievement badge
     */
    updateGoalBadge(goalId) {
        const badge = document.querySelector(`#achievement-badge-${goalId}`);
        const achievementData = this.achievementData[goalId];
        
        if (badge && achievementData) {
            badge.innerHTML = this.getAchievementBadge(achievementData, this.currentWindow);
        }
    }
    
    /**
     * Get achievement badge HTML
     */
    getAchievementBadge(achievementData, windowType) {
        if (windowType === 'mid_year' && achievementData.midYearReview) {
            const option = this.midYearOptions.find(opt => opt.value === achievementData.midYearReview);
            return `<span class="badge badge-${achievementData.midYearReview.toLowerCase()}">${option?.label || achievementData.midYearReview}</span>`;
        } else if (windowType === 'year_end' && achievementData.achievedRatio) {
            return `<span class="badge badge-achievement">${achievementData.achievedRatio}%</span>`;
        }
        return '<span class="badge badge-pending">Pending</span>';
    }
    
    /**
     * Calculate weighted score
     */
    calculateWeightedScore(weightage, achievedRatio) {
        const score = (weightage * achievedRatio) / 100;
        return score.toFixed(1);
    }
    
    /**
     * Update progress summary
     */
    updateProgressSummary() {
        const totalGoals = this.currentGoals.length;
        let reviewedGoals = 0;
        let totalWeightedScore = 0;
        
        this.currentGoals.forEach(goal => {
            const achievementData = this.achievementData[goal.id];
            if (achievementData) {
                if (this.currentWindow === 'mid_year' && achievementData.midYearReview) {
                    reviewedGoals++;
                } else if (this.currentWindow === 'year_end' && achievementData.achievedRatio) {
                    reviewedGoals++;
                    totalWeightedScore += parseFloat(this.calculateWeightedScore(goal.weightage, achievementData.achievedRatio));
                }
            }
        });
        
        const progressPercentage = totalGoals > 0 ? Math.round((reviewedGoals / totalGoals) * 100) : 0;
        
        // Update progress circle
        const progressElement = document.querySelector('#overall-progress .stat-value');
        if (progressElement) {
            progressElement.textContent = `${progressPercentage}%`;
        }
        
        // Update completed goals
        const completedElement = document.querySelector('#completed-goals');
        if (completedElement) {
            completedElement.textContent = `${reviewedGoals}/${totalGoals}`;
        }
        
        // Update weighted score
        const scoreElement = document.querySelector('#total-weighted-score');
        if (scoreElement) {
            scoreElement.textContent = totalWeightedScore.toFixed(1);
        }
        
        // Update performance rating stars
        this.updatePerformanceRating(totalWeightedScore);
    }
    
    /**
     * Update performance rating stars
     */
    updatePerformanceRating(score) {
        const ratingElement = document.querySelector('#performance-rating .rating-stars');
        if (!ratingElement) return;
        
        const stars = ratingElement.querySelectorAll('.star');
        let filledStars = 0;
        
        if (score >= 90) filledStars = 5;
        else if (score >= 80) filledStars = 4;
        else if (score >= 70) filledStars = 3;
        else if (score >= 60) filledStars = 2;
        else if (score >= 50) filledStars = 1;
        
        stars.forEach((star, index) => {
            star.classList.toggle('filled', index < filledStars);
        });
    }
    
    /**
     * Calculate totals and update summary
     */
    calculateTotals() {
        if (this.currentWindow !== 'year_end') return;
        
        const breakdown = document.querySelector('#calculation-breakdown');
        const totalElement = document.querySelector('#total-performance-score');
        const ratingDisplay = document.querySelector('#final-rating-display');
        
        if (!breakdown || !totalElement) return;
        
        let totalScore = 0;
        let breakdownHTML = '';
        
        this.currentGoals.forEach((goal, index) => {
            const achievementData = this.achievementData[goal.id] || {};
            const achievedRatio = achievementData.achievedRatio || 0;
            const weightedScore = parseFloat(this.calculateWeightedScore(goal.weightage, achievedRatio));
            totalScore += weightedScore;
            
            breakdownHTML += `
                <div class="breakdown-row">
                    <div>Goal ${index + 1}</div>
                    <div>${goal.weightage}%</div>
                    <div>${achievedRatio}%</div>
                    <div>${weightedScore.toFixed(1)}</div>
                </div>
            `;
        });
        
        breakdown.innerHTML = breakdownHTML;
        totalElement.textContent = totalScore.toFixed(1);
        
        // Update final rating display
        if (ratingDisplay) {
            const rating = this.getPerformanceRating(totalScore);
            ratingDisplay.innerHTML = `
                <div class="rating-medal ${rating.class}">${rating.medal}</div>
                <div class="rating-text">
                    <div class="rating-title">${rating.title}</div>
                    <div class="rating-score">${totalScore.toFixed(1)} / 100</div>
                </div>
            `;
        }
    }
    
    /**
     * Get performance rating based on score
     */
    getPerformanceRating(score) {
        if (score >= 90) {
            return { title: 'Outstanding', medal: '🏆', class: 'excellent' };
        } else if (score >= 80) {
            return { title: 'Exceeds Expectations', medal: '🥇', class: 'good' };
        } else if (score >= 70) {
            return { title: 'Meets Expectations', medal: '🥈', class: 'satisfactory' };
        } else if (score >= 60) {
            return { title: 'Below Expectations', medal: '🥉', class: 'needs-improvement' };
        } else {
            return { title: 'Unsatisfactory', medal: '📋', class: 'unsatisfactory' };
        }
    }
    
    /**
     * Populate existing data
     */
    populateExistingData() {
        // Data is already populated in the HTML generation
        // Update progress summary and calculations
        this.updateProgressSummary();
        if (this.currentWindow === 'year_end') {
            this.calculateTotals();
        }
    }
    
    /**
     * Validate achievement data
     */
    validateAchievements() {
        const errors = [];
        
        if (this.currentWindow === 'mid_year') {
            this.currentGoals.forEach((goal, index) => {
                const achievementData = this.achievementData[goal.id];
                if (!achievementData || !achievementData.midYearReview) {
                    errors.push(`Goal ${index + 1}: Mid-year review status is required`);
                }
            });
        } else if (this.currentWindow === 'year_end') {
            this.currentGoals.forEach((goal, index) => {
                const achievementData = this.achievementData[goal.id];
                if (!achievementData || !achievementData.achievedRatio) {
                    errors.push(`Goal ${index + 1}: Achievement ratio is required`);
                }
            });
        }
        
        return errors;
    }
    
    /**
     * Save achievements
     */
    async saveAchievements() {
        try {
            // Validate data
            const errors = this.validateAchievements();
            if (errors.length > 0) {
                window.App.showNotification('Please fix the following errors:\n' + errors.join('\n'), 'error');
                return;
            }
            
            // Show loading
            const submitBtn = document.querySelector('#achievement-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
            }
            
            // Prepare data for saving
            const saveData = {
                empCode: window.AuthManager.getCurrentUser().emp_code,
                windowType: this.currentWindow,
                achievements: this.achievementData,
                timestamp: new Date().toISOString()
            };
            
            // Save to backend
            await window.DataHandler.saveAchievementData?.(saveData) || 
                  window.DataHandler.saveGoals(saveData.empCode, this.currentGoals.map(goal => ({
                      ...goal,
                      ...this.achievementData[goal.id]
                  })));
            
            window.App.showNotification(
                `${this.currentWindow === 'mid_year' ? 'Mid-year review' : 'Achievements'} saved successfully!`, 
                'success'
            );
            
            // Update displays
            this.updateProgressSummary();
            if (this.currentWindow === 'year_end') {
                this.calculateTotals();
            }
            
        } catch (error) {
            console.error('Error saving achievements:', error);
            window.App.showNotification('Error saving achievements: ' + error.message, 'error');
        } finally {
            // Reset button
            const submitBtn = document.querySelector('#achievement-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = `Save ${this.currentWindow === 'mid_year' ? 'Review' : 'Achievements'}`;
            }
        }
    }
    
    /**
     * Save draft
     */
    async saveDraft() {
        try {
            const saveData = {
                empCode: window.AuthManager.getCurrentUser().emp_code,
                windowType: this.currentWindow,
                achievements: this.achievementData,
                isDraft: true,
                timestamp: new Date().toISOString()
            };
            
            await window.DataHandler.saveAchievementData?.(saveData) || 
                  window.DataHandler.saveGoals(saveData.empCode, this.currentGoals);
            
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
     * Export achievement data
     */
    exportAchievements(format = 'pdf') {
        const data = {
            employee: window.AuthManager.getCurrentUser(),
            goals: this.currentGoals,
            achievements: this.achievementData,
            windowType: this.currentWindow,
            timestamp: new Date().toISOString(),
            summary: this.calculateSummaryData()
        };
        
        switch (format) {
            case 'json':
                this.downloadJSON(data, `achievements-${this.currentWindow}.json`);
                break;
            case 'csv':
                this.exportToCSV();
                break;
            case 'pdf':
                this.generatePDF(data);
                break;
        }
    }
    
    calculateSummaryData() {
        let totalScore = 0;
        const goalSummaries = this.currentGoals.map(goal => {
            const achievementData = this.achievementData[goal.id] || {};
            const weightedScore = parseFloat(this.calculateWeightedScore(goal.weightage, achievementData.achievedRatio || 0));
            totalScore += weightedScore;
            
            return {
                title: goal.kra_title,
                weightage: goal.weightage,
                midYearReview: achievementData.midYearReview,
                achievedRatio: achievementData.achievedRatio,
                weightedScore: weightedScore
            };
        });
        
        return {
            totalScore,
            goalSummaries,
            rating: this.getPerformanceRating(totalScore)
        };
    }
    
    exportToCSV() {
        const csvData = [];
        
        this.currentGoals.forEach((goal, goalIndex) => {
            const achievementData = this.achievementData[goal.id] || {};
            csvData.push({
                'Goal Number': goalIndex + 1,
                'KRA Title': goal.kra_title,
                'Weightage (%)': goal.weightage,
                'Mid Year Review': achievementData.midYearReview || 'N/A',
                'Achievement Ratio (%)': achievementData.achievedRatio || 0,
                'Weighted Score': this.calculateWeightedScore(goal.weightage, achievementData.achievedRatio || 0),
                'Notes': achievementData.achievementEvidence || achievementData.midYearNotes || ''
            });
        });
        
        window.DataHandler.exportToCSV(csvData, `achievements-${this.currentWindow}.csv`);
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
window.ActualAchievementManager = new ActualAchievementManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActualAchievementManager;
}