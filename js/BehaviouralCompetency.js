/**
 * BehaviouralCompetency.js - Behavioural Competency Evaluation Module
 * Handles competency assessment with behavior demonstrations and scoring
 * Active during Year-End window only
 */

class BehaviouralCompetencyManager {
    constructor() {
        this.competencies = [];
        this.competencyMaster = [];
        this.evaluationData = {};
        this.isWindowActive = false;
        this.isReadOnly = false;
        this.currentReviewer = null;
        
        // Scoring options
        this.scoreOptions = [
            { value: 5, label: 'Outstanding (5)', description: 'Consistently exceeds expectations in all aspects' },
            { value: 4, label: 'Good (4)', description: 'Frequently exceeds expectations' },
            { value: 3, label: 'Satisfactory (3)', description: 'Meets expectations consistently' },
            { value: 2, label: 'Needs Improvement (2)', description: 'Sometimes meets expectations' },
            { value: 1, label: 'Unsatisfactory (1)', description: 'Rarely meets expectations' }
        ];
        
        // Default competency categories
        this.defaultCompetencies = [
            {
                id: 1,
                name: 'Leadership & Vision',
                description: 'Ability to lead teams and provide strategic direction',
                isActive: true,
                sortOrder: 1
            },
            {
                id: 2,
                name: 'Communication & Collaboration',
                description: 'Effective communication and teamwork skills',
                isActive: true,
                sortOrder: 2
            },
            {
                id: 3,
                name: 'Problem Solving & Innovation',
                description: 'Analytical thinking and creative problem-solving abilities',
                isActive: true,
                sortOrder: 3
            },
            {
                id: 4,
                name: 'Customer Focus & Service Excellence',
                description: 'Commitment to customer satisfaction and service quality',
                isActive: true,
                sortOrder: 4
            },
            {
                id: 5,
                name: 'Professional Development & Learning',
                description: 'Continuous learning and skill development',
                isActive: true,
                sortOrder: 5
            },
            {
                id: 6,
                name: 'Integrity & Ethics',
                description: 'Adherence to ethical standards and professional integrity',
                isActive: true,
                sortOrder: 6
            },
            {
                id: 7,
                name: 'Adaptability & Change Management',
                description: 'Flexibility and ability to manage change effectively',
                isActive: true,
                sortOrder: 7
            },
            {
                id: 8,
                name: 'Team Building & Mentoring',
                description: 'Ability to build teams and mentor colleagues',
                isActive: true,
                sortOrder: 8
            }
        ];
        
        this.init();
    }
    
    /**
     * Initialize Behavioural Competency module
     */
    init() {
        this.bindEvents();
        this.checkWindowStatus();
    }
    
    /**
     * Check if competency evaluation window is active
     */
    async checkWindowStatus() {
        try {
            const timeWindow = await window.DataHandler.getActiveTimeWindow();
            this.isWindowActive = timeWindow.competencyWindow?.active || false;
            this.isReadOnly = timeWindow.competencyWindow?.readOnly || false;
            
            // Check if user has permission to evaluate
            const currentUser = window.AuthManager.getCurrentUser();
            this.canEvaluate = this.checkEvaluationPermission(currentUser);
            
            this.updateWindowStatus();
        } catch (error) {
            console.error('Error checking window status:', error);
            this.isWindowActive = false;
            this.updateWindowStatus();
        }
    }
    
    /**
     * Check if user has permission to evaluate competencies
     */
    checkEvaluationPermission(user) {
        // Competency evaluation is typically done by reviewers/managers
        const evaluatorRoles = ['approval_manager1', 'approval_manager2', 'hr_manager1', 'hr_manager2', 'admin'];
        return evaluatorRoles.includes(user?.user_type) || user?.user_type === 'individual_user'; // Allow self-evaluation for now
    }
    
    /**
     * Update UI based on window status
     */
    updateWindowStatus() {
        const statusIndicator = document.querySelector('#competency-window-status .status-indicator');
        const statusText = document.querySelector('#competency-window-status .status-text');
        
        if (statusIndicator && statusText) {
            if (this.isWindowActive && !this.isReadOnly && this.canEvaluate) {
                statusIndicator.className = 'status-indicator active';
                statusText.textContent = 'Active - Competency evaluation window is open';
            } else if (!this.canEvaluate) {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'No Permission - Contact your manager for evaluation';
            } else if (this.isReadOnly) {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Read Only - Evaluation period has ended';
            } else {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Inactive - Competency evaluation window is closed';
            }
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab activation
        document.addEventListener('tab-activated', (e) => {
            if (e.detail.tabId === 'behavioural-competency') {
                this.loadContent();
            }
        });
        
        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'competency-form') {
                e.preventDefault();
                this.saveCompetencies();
            }
        });
    }
    
    /**
     * Load competency content
     */
    async loadContent() {
        const contentDiv = document.querySelector('#competency-content');
        if (!contentDiv) return;
        
        try {
            // Show loading
            contentDiv.innerHTML = this.getLoadingHTML();
            
            // Load competency master data
            try {
                this.competencyMaster = await window.DataHandler.getCompetencyMaster();
            } catch (error) {
                console.log('Using default competencies');
                this.competencyMaster = this.defaultCompetencies;
            }
            
            // Load existing competency evaluations
            const currentUser = window.AuthManager.getCurrentUser();
            if (currentUser) {
                try {
                    this.evaluationData = await window.DataHandler.getBehaviouralCompetencies(currentUser.emp_code) || {};
                } catch (error) {
                    console.log('No existing competency data found');
                    this.evaluationData = {};
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
            console.error('Error loading competency content:', error);
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
                <p>Loading behavioural competency evaluation...</p>
            </div>
        `;
    }
    
    /**
     * Get error HTML
     */
    getErrorHTML(message) {
        return `
            <div class="alert alert-error">
                <h4>Error Loading Competency Evaluation</h4>
                <p>${message}</p>
                <button class="btn btn-primary mt-4" onclick="window.BehaviouralCompetencyManager.loadContent()">
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
            <div class="competency-container">
                ${this.getInstructionsHTML()}
                ${this.getEvaluationSummaryHTML()}
                ${this.getCompetencyFormHTML()}
                ${this.getScoringSummaryHTML()}
            </div>
        `;
    }
    
    /**
     * Get instructions HTML
     */
    getInstructionsHTML() {
        return `
            <div class="card mb-6">
                <h4>Behavioural Competency Evaluation Instructions</h4>
                <div class="instructions-grid">
                    <div class="instruction-item">
                        <div class="instruction-icon">📝</div>
                        <div>
                            <h5>Behavior Demonstrations</h5>
                            <p>For each competency, provide exactly 2 specific examples of behaviors demonstrated</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">⭐</div>
                        <div>
                            <h5>Scoring Scale</h5>
                            <p>Rate each behavior on a scale of 1-5: Outstanding (5), Good (4), Satisfactory (3), Needs Improvement (2), Unsatisfactory (1)</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🧮</div>
                        <div>
                            <h5>Auto-Calculation</h5>
                            <p>Competency scores are automatically calculated as the average of the 2 behavior scores</p>
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">📊</div>
                        <div>
                            <h5>Overall Score</h5>
                            <p>Your overall behavioral score is the average of all competency scores</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get evaluation summary HTML
     */
    getEvaluationSummaryHTML() {
        return `
            <div class="evaluation-summary-card">
                <h4>Competency Evaluation Overview</h4>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="stat-circle" id="competency-progress">
                            <span class="stat-value">0%</span>
                        </div>
                        <div class="stat-label">Completion Progress</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-number" id="evaluated-competencies">0</div>
                        <div class="stat-label">Competencies Evaluated</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-number" id="average-score">0.0</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-rating" id="overall-rating">
                            <div class="rating-display">
                                <div class="rating-stars">
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                    <span class="star">★</span>
                                </div>
                                <div class="rating-text">Not Rated</div>
                            </div>
                        </div>
                        <div class="stat-label">Overall Rating</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get competency form HTML
     */
    getCompetencyFormHTML() {
        const isDisabled = this.isReadOnly || !this.isWindowActive || !this.canEvaluate;
        
        return `
            <form id="competency-form" class="competency-form">
                <div class="form-header">
                    <h4>Behavioural Competency Evaluation</h4>
                    ${!isDisabled ? `
                        <div class="form-actions">
                            <button type="button" id="auto-save-toggle" class="btn btn-sm btn-success">
                                Auto-save: ON
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="competencies-list">
                    ${this.competencyMaster
                        .filter(comp => comp.isActive)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((competency, index) => this.getCompetencyHTML(competency, index, isDisabled))
                        .join('')}
                </div>
                
                ${!isDisabled ? `
                    <div class="form-footer">
                        <div class="form-actions">
                            <button type="button" id="save-draft-btn" class="btn btn-secondary">
                                Save Draft
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Save Evaluation
                            </button>
                        </div>
                        <p class="text-muted text-sm">
                            Competency evaluations will be locked after the evaluation window closes.
                        </p>
                    </div>
                ` : `
                    <div class="alert alert-info">
                        <p>Competency evaluation period has ended. Data is now read-only.</p>
                    </div>
                `}
            </form>
        `;
    }
    
    /**
     * Get HTML for individual competency
     */
    getCompetencyHTML(competency, index, isDisabled) {
        const competencyData = this.evaluationData[competency.id] || {};
        
        return `
            <div class="competency-card" data-competency-id="${competency.id}">
                <div class="competency-header">
                    <div class="competency-info">
                        <h5>${competency.name}</h5>
                        <p class="competency-description">${competency.description}</p>
                    </div>
                    <div class="competency-score-display">
                        <div class="score-circle" id="score-circle-${competency.id}">
                            <span class="score-value">0.0</span>
                        </div>
                        <div class="score-label">Avg Score</div>
                    </div>
                </div>
                
                <div class="behaviors-section">
                    <h6>Behavior Demonstrations</h6>
                    <p class="text-muted text-sm">Provide 2 specific examples of behaviors demonstrated for this competency</p>
                    
                    <div class="behavior-items">
                        ${[1, 2].map(behaviorNum => this.getBehaviorHTML(competency.id, behaviorNum, competencyData, isDisabled)).join('')}
                    </div>
                </div>
                
                <div class="other-remarks-section">
                    <div class="form-group">
                        <label for="remarks-${competency.id}">Other Remarks (Optional)</label>
                        <textarea 
                            id="remarks-${competency.id}" 
                            class="form-control competency-remarks" 
                            data-competency-id="${competency.id}"
                            placeholder="Add any additional comments or observations..."
                            rows="2"
                            maxlength="500"
                            ${isDisabled ? 'disabled' : ''}
                        >${competencyData.otherRemarks || ''}</textarea>
                        <div class="character-count">
                            <span id="char-count-${competency.id}">0</span>/500 characters
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get HTML for individual behavior
     */
    getBehaviorHTML(competencyId, behaviorNum, competencyData, isDisabled) {
        const behaviorKey = `behaviour_${behaviorNum}`;
        const scoreKey = `behaviour_${behaviorNum}_score`;
        const behaviorText = competencyData[behaviorKey] || '';
        const behaviorScore = competencyData[scoreKey] || '';
        
        return `
            <div class="behavior-item">
                <div class="behavior-header">
                    <h6>Behavior Demonstration ${behaviorNum}</h6>
                    <div class="behavior-score">
                        <select 
                            class="form-control behavior-score-select" 
                            data-competency-id="${competencyId}"
                            data-behavior-num="${behaviorNum}"
                            ${isDisabled ? 'disabled' : ''}
                        >
                            <option value="">Select score...</option>
                            ${this.scoreOptions.map(option => `
                                <option value="${option.value}" ${behaviorScore == option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <textarea 
                        class="form-control behavior-description" 
                        data-competency-id="${competencyId}"
                        data-behavior-num="${behaviorNum}"
                        placeholder="Describe a specific example of behavior demonstrated for this competency..."
                        rows="3"
                        ${isDisabled ? 'disabled' : ''}
                    >${behaviorText}</textarea>
                </div>
                
                <div class="score-description">
                    <div id="score-desc-${competencyId}-${behaviorNum}" class="score-description-text">
                        ${behaviorScore ? this.scoreOptions.find(opt => opt.value == behaviorScore)?.description || '' : 'Select a score to see description'}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get scoring summary HTML
     */
    getScoringSummaryHTML() {
        return `
            <div class="scoring-summary-card">
                <h4>Competency Scoring Summary</h4>
                <div class="scoring-table">
                    <div class="scoring-header">
                        <div>Competency</div>
                        <div>Behavior 1</div>
                        <div>Behavior 2</div>
                        <div>Avg Score</div>
                    </div>
                    <div id="scoring-breakdown" class="scoring-breakdown">
                        <!-- Will be populated dynamically -->
                    </div>
                    <div class="scoring-footer">
                        <div class="total-row">
                            <div>Overall Behavioral Score:</div>
                            <div></div>
                            <div></div>
                            <div id="overall-behavioral-score" class="total-score">0.0</div>
                        </div>
                    </div>
                </div>
                
                <div class="performance-insights">
                    <h5>Performance Insights</h5>
                    <div id="competency-insights" class="insights-list">
                        <!-- Will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind dynamic events
     */
    bindDynamicEvents() {
        // Behavior description inputs
        document.querySelectorAll('.behavior-description').forEach(textarea => {
            textarea.addEventListener('input', (e) => this.handleBehaviorDescriptionChange(e));
        });
        
        // Behavior score selects
        document.querySelectorAll('.behavior-score-select').forEach(select => {
            select.addEventListener('change', (e) => this.handleBehaviorScoreChange(e));
        });
        
        // Competency remarks
        document.querySelectorAll('.competency-remarks').forEach(textarea => {
            textarea.addEventListener('input', (e) => this.handleRemarksChange(e));
            this.updateCharacterCount(textarea);
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
        if (!this.isReadOnly && this.isWindowActive && this.canEvaluate) {
            document.addEventListener('input', (e) => {
                if (e.target.closest('#competency-form')) {
                    this.scheduleAutoSave();
                }
            });
        }
    }
    
    /**
     * Handle behavior description change
     */
    handleBehaviorDescriptionChange(e) {
        const competencyId = parseInt(e.target.dataset.competencyId);
        const behaviorNum = parseInt(e.target.dataset.behaviorNum);
        const value = e.target.value;
        
        if (!this.evaluationData[competencyId]) {
            this.evaluationData[competencyId] = {};
        }
        
        this.evaluationData[competencyId][`behaviour_${behaviorNum}`] = value;
        this.updateCompetencyProgress();
    }
    
    /**
     * Handle behavior score change
     */
    handleBehaviorScoreChange(e) {
        const competencyId = parseInt(e.target.dataset.competencyId);
        const behaviorNum = parseInt(e.target.dataset.behaviorNum);
        const value = parseInt(e.target.value) || 0;
        
        if (!this.evaluationData[competencyId]) {
            this.evaluationData[competencyId] = {};
        }
        
        this.evaluationData[competencyId][`behaviour_${behaviorNum}_score`] = value;
        
        // Update score description
        const scoreDesc = document.querySelector(`#score-desc-${competencyId}-${behaviorNum}`);
        if (scoreDesc) {
            const option = this.scoreOptions.find(opt => opt.value === value);
            scoreDesc.textContent = option ? option.description : 'Select a score to see description';
        }
        
        // Calculate and update competency score
        this.updateCompetencyScore(competencyId);
        this.updateCompetencyProgress();
        this.calculateTotals();
    }
    
    /**
     * Handle remarks change
     */
    handleRemarksChange(e) {
        const competencyId = parseInt(e.target.dataset.competencyId);
        const value = e.target.value;
        
        if (!this.evaluationData[competencyId]) {
            this.evaluationData[competencyId] = {};
        }
        
        this.evaluationData[competencyId].otherRemarks = value;
        this.updateCharacterCount(e.target);
    }
    
    /**
     * Update character count for remarks
     */
    updateCharacterCount(textarea) {
        const competencyId = textarea.dataset.competencyId;
        const countElement = document.querySelector(`#char-count-${competencyId}`);
        if (countElement) {
            countElement.textContent = textarea.value.length;
            countElement.className = textarea.value.length > 450 ? 'text-warning' : '';
        }
    }
    
    /**
     * Update competency score display
     */
    updateCompetencyScore(competencyId) {
        const competencyData = this.evaluationData[competencyId];
        if (!competencyData) return;
        
        const score1 = competencyData.behaviour_1_score || 0;
        const score2 = competencyData.behaviour_2_score || 0;
        
        let avgScore = 0;
        if (score1 > 0 && score2 > 0) {
            avgScore = (score1 + score2) / 2;
        } else if (score1 > 0 || score2 > 0) {
            avgScore = (score1 + score2) / 1; // Partial scoring
        }
        
        // Update competency total score
        competencyData.competency_total_score = avgScore;
        
        // Update display
        const scoreCircle = document.querySelector(`#score-circle-${competencyId} .score-value`);
        if (scoreCircle) {
            scoreCircle.textContent = avgScore.toFixed(1);
        }
        
        // Update score circle color
        const circle = document.querySelector(`#score-circle-${competencyId}`);
        if (circle) {
            circle.className = `score-circle ${this.getScoreClass(avgScore)}`;
        }
    }
    
    /**
     * Get CSS class based on score
     */
    getScoreClass(score) {
        if (score >= 4.5) return 'score-excellent';
        if (score >= 3.5) return 'score-good';
        if (score >= 2.5) return 'score-satisfactory';
        if (score >= 1.5) return 'score-needs-improvement';
        if (score > 0) return 'score-unsatisfactory';
        return '';
    }
    
    /**
     * Update competency progress
     */
    updateCompetencyProgress() {
        const totalCompetencies = this.competencyMaster.filter(comp => comp.isActive).length;
        let completedCompetencies = 0;
        
        this.competencyMaster.forEach(competency => {
            if (!competency.isActive) return;
            
            const data = this.evaluationData[competency.id];
            if (data && 
                data.behaviour_1 && data.behaviour_1.trim() &&
                data.behaviour_2 && data.behaviour_2.trim() &&
                data.behaviour_1_score > 0 &&
                data.behaviour_2_score > 0) {
                completedCompetencies++;
            }
        });
        
        const progressPercentage = totalCompetencies > 0 ? Math.round((completedCompetencies / totalCompetencies) * 100) : 0;
        
        // Update progress display
        const progressElement = document.querySelector('#competency-progress .stat-value');
        if (progressElement) {
            progressElement.textContent = `${progressPercentage}%`;
        }
        
        const evaluatedElement = document.querySelector('#evaluated-competencies');
        if (evaluatedElement) {
            evaluatedElement.textContent = `${completedCompetencies}/${totalCompetencies}`;
        }
    }
    
    /**
     * Calculate totals and update summary
     */
    calculateTotals() {
        let totalScore = 0;
        let validScores = 0;
        const breakdown = document.querySelector('#scoring-breakdown');
        
        if (breakdown) {
            let breakdownHTML = '';
            
            this.competencyMaster
                .filter(comp => comp.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .forEach(competency => {
                    const data = this.evaluationData[competency.id] || {};
                    const score1 = data.behaviour_1_score || 0;
                    const score2 = data.behaviour_2_score || 0;
                    const avgScore = data.competency_total_score || 0;
                    
                    if (avgScore > 0) {
                        totalScore += avgScore;
                        validScores++;
                    }
                    
                    breakdownHTML += `
                        <div class="breakdown-row">
                            <div class="competency-name">${competency.name}</div>
                            <div class="behavior-score ${score1 > 0 ? this.getScoreClass(score1) : ''}">${score1 || '-'}</div>
                            <div class="behavior-score ${score2 > 0 ? this.getScoreClass(score2) : ''}">${score2 || '-'}</div>
                            <div class="avg-score ${avgScore > 0 ? this.getScoreClass(avgScore) : ''}">${avgScore.toFixed(1)}</div>
                        </div>
                    `;
                });
            
            breakdown.innerHTML = breakdownHTML;
        }
        
        // Calculate overall score
        const overallScore = validScores > 0 ? totalScore / validScores : 0;
        
        // Update displays
        const avgScoreElement = document.querySelector('#average-score');
        if (avgScoreElement) {
            avgScoreElement.textContent = overallScore.toFixed(1);
        }
        
        const overallScoreElement = document.querySelector('#overall-behavioral-score');
        if (overallScoreElement) {
            overallScoreElement.textContent = overallScore.toFixed(1);
        }
        
        // Update rating stars
        this.updateRatingStars(overallScore);
        
        // Update insights
        this.updateInsights(overallScore);
    }
    
    /**
     * Update rating stars display
     */
    updateRatingStars(score) {
        const ratingElement = document.querySelector('#overall-rating');
        if (!ratingElement) return;
        
        const stars = ratingElement.querySelectorAll('.star');
        const ratingText = ratingElement.querySelector('.rating-text');
        
        let filledStars = Math.round(score);
        let ratingLabel = this.getRatingLabel(score);
        
        stars.forEach((star, index) => {
            star.classList.toggle('filled', index < filledStars);
        });
        
        if (ratingText) {
            ratingText.textContent = ratingLabel;
        }
    }
    
    /**
     * Get rating label based on score
     */
    getRatingLabel(score) {
        if (score >= 4.5) return 'Outstanding';
        if (score >= 3.5) return 'Good';
        if (score >= 2.5) return 'Satisfactory';
        if (score >= 1.5) return 'Needs Improvement';
        if (score > 0) return 'Unsatisfactory';
        return 'Not Rated';
    }
    
    /**
     * Update performance insights
     */
    updateInsights(overallScore) {
        const insightsElement = document.querySelector('#competency-insights');
        if (!insightsElement) return;
        
        const insights = [];
        
        // Analyze competency scores
        const competencyScores = this.competencyMaster
            .filter(comp => comp.isActive)
            .map(comp => {
                const data = this.evaluationData[comp.id] || {};
                return {
                    name: comp.name,
                    score: data.competency_total_score || 0
                };
            })
            .filter(comp => comp.score > 0);
        
        if (competencyScores.length === 0) {
            insights.push({
                type: 'info',
                text: 'Start evaluating competencies to see performance insights.'
            });
        } else {
            // Find strengths (scores >= 4)
            const strengths = competencyScores.filter(comp => comp.score >= 4);
            if (strengths.length > 0) {
                insights.push({
                    type: 'success',
                    text: `Strengths: ${strengths.map(s => s.name).join(', ')}`
                });
            }
            
            // Find development areas (scores < 3)
            const developmentAreas = competencyScores.filter(comp => comp.score < 3);
            if (developmentAreas.length > 0) {
                insights.push({
                    type: 'warning',
                    text: `Development Areas: ${developmentAreas.map(d => d.name).join(', ')}`
                });
            }
            
            // Overall performance insight
            if (overallScore >= 4) {
                insights.push({
                    type: 'success',
                    text: 'Excellent overall behavioral performance with consistent demonstration of competencies.'
                });
            } else if (overallScore >= 3) {
                insights.push({
                    type: 'info',
                    text: 'Good behavioral performance meeting expectations across most competencies.'
                });
            } else if (overallScore >= 2) {
                insights.push({
                    type: 'warning',
                    text: 'Behavioral performance shows room for improvement in several competency areas.'
                });
            } else if (overallScore > 0) {
                insights.push({
                    type: 'error',
                    text: 'Behavioral performance requires significant development across multiple competencies.'
                });
            }
        }
        
        insightsElement.innerHTML = insights.map(insight => `
            <div class="insight-item insight-${insight.type}">
                <div class="insight-icon">
                    ${insight.type === 'success' ? '✅' : 
                      insight.type === 'warning' ? '⚠️' : 
                      insight.type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
    }
    
    /**
     * Populate existing data
     */
    populateExistingData() {
        // Data is already populated in HTML generation
        // Update calculations and displays
        this.competencyMaster.forEach(competency => {
            if (competency.isActive && this.evaluationData[competency.id]) {
                this.updateCompetencyScore(competency.id);
            }
        });
        
        this.updateCompetencyProgress();
        this.calculateTotals();
    }
    
    /**
     * Validate competency data
     */
    validateCompetencies() {
        const errors = [];
        
        this.competencyMaster
            .filter(comp => comp.isActive)
            .forEach((competency, index) => {
                const data = this.evaluationData[competency.id];
                const compNumber = index + 1;
                
                if (!data) {
                    errors.push(`${competency.name}: No evaluation data provided`);
                    return;
                }
                
                // Check behavior demonstrations
                if (!data.behaviour_1 || data.behaviour_1.trim().length === 0) {
                    errors.push(`${competency.name}: First behavior demonstration is required`);
                }
                
                if (!data.behaviour_2 || data.behaviour_2.trim().length === 0) {
                    errors.push(`${competency.name}: Second behavior demonstration is required`);
                }
                
                // Check scores
                if (!data.behaviour_1_score || data.behaviour_1_score < 1 || data.behaviour_1_score > 5) {
                    errors.push(`${competency.name}: First behavior score must be between 1-5`);
                }
                
                if (!data.behaviour_2_score || data.behaviour_2_score < 1 || data.behaviour_2_score > 5) {
                    errors.push(`${competency.name}: Second behavior score must be between 1-5`);
                }
                
                // Check remarks length
                if (data.otherRemarks && data.otherRemarks.length > 500) {
                    errors.push(`${competency.name}: Remarks cannot exceed 500 characters`);
                }
            });
        
        return errors;
    }
    
    /**
     * Save competencies
     */
    async saveCompetencies() {
        try {
            // Validate data
            const errors = this.validateCompetencies();
            if (errors.length > 0) {
                window.App.showNotification('Please fix the following errors:\n' + errors.join('\n'), 'error');
                return;
            }
            
            // Show loading
            const submitBtn = document.querySelector('#competency-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
            }
            
            // Prepare data for saving
            const saveData = {
                empCode: window.AuthManager.getCurrentUser().emp_code,
                reviewerEmpCode: this.currentReviewer?.emp_code || window.AuthManager.getCurrentUser().emp_code,
                competencies: this.evaluationData,
                timestamp: new Date().toISOString()
            };
            
            // Save to backend
            await window.DataHandler.saveBehaviouralCompetencies(saveData.empCode, this.evaluationData);
            
            window.App.showNotification('Competency evaluation saved successfully!', 'success');
            
            // Update displays
            this.calculateTotals();
            
        } catch (error) {
            console.error('Error saving competencies:', error);
            window.App.showNotification('Error saving competencies: ' + error.message, 'error');
        } finally {
            // Reset button
            const submitBtn = document.querySelector('#competency-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Evaluation';
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
                reviewerEmpCode: this.currentReviewer?.emp_code || window.AuthManager.getCurrentUser().emp_code,
                competencies: this.evaluationData,
                isDraft: true,
                timestamp: new Date().toISOString()
            };
            
            await window.DataHandler.saveBehaviouralCompetencies(saveData.empCode, this.evaluationData);
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
     * Export competency data
     */
    exportCompetencies(format = 'pdf') {
        const data = {
            employee: window.AuthManager.getCurrentUser(),
            reviewer: this.currentReviewer,
            competencies: this.competencyMaster.filter(comp => comp.isActive),
            evaluations: this.evaluationData,
            timestamp: new Date().toISOString(),
            summary: this.calculateSummaryData()
        };
        
        switch (format) {
            case 'json':
                this.downloadJSON(data, 'behavioral-competency-evaluation.json');
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
        let validScores = 0;
        
        const competencySummaries = this.competencyMaster
            .filter(comp => comp.isActive)
            .map(competency => {
                const data = this.evaluationData[competency.id] || {};
                const avgScore = data.competency_total_score || 0;
                
                if (avgScore > 0) {
                    totalScore += avgScore;
                    validScores++;
                }
                
                return {
                    name: competency.name,
                    behavior1: data.behaviour_1 || '',
                    behavior1Score: data.behaviour_1_score || 0,
                    behavior2: data.behaviour_2 || '',
                    behavior2Score: data.behaviour_2_score || 0,
                    avgScore: avgScore,
                    remarks: data.otherRemarks || ''
                };
            });
        
        const overallScore = validScores > 0 ? totalScore / validScores : 0;
        
        return {
            overallScore,
            competencySummaries,
            rating: this.getRatingLabel(overallScore)
        };
    }
    
    exportToCSV() {
        const csvData = [];
        
        this.competencyMaster
            .filter(comp => comp.isActive)
            .forEach(competency => {
                const data = this.evaluationData[competency.id] || {};
                csvData.push({
                    'Competency': competency.name,
                    'Description': competency.description,
                    'Behavior 1': data.behaviour_1 || '',
                    'Behavior 1 Score': data.behaviour_1_score || 0,
                    'Behavior 2': data.behaviour_2 || '',
                    'Behavior 2 Score': data.behaviour_2_score || 0,
                    'Average Score': data.competency_total_score || 0,
                    'Other Remarks': data.otherRemarks || ''
                });
            });
        
        window.DataHandler.exportToCSV(csvData, 'behavioral-competency-evaluation.csv');
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
window.BehaviouralCompetencyManager = new BehaviouralCompetencyManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BehaviouralCompetencyManager;
}