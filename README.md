[enhanced_pms_plan.md](https://github.com/user-attachments/files/22234049/enhanced_pms_plan.md)
# Enhanced Performance Management System Plan

## Project Overview
Build a comprehensive Performance Management System with SMART Goals tracking, Behavioural Competency evaluation, featuring role-based access control and time-window based functionality activation.

## Technical Stack Requirements

### Frontend
- **HTML5** - Semantic structure with accessibility considerations
- **CSS3** - Responsive design with modern styling (Grid/Flexbox)
- **Vanilla JavaScript** - Single page application with dynamic content loading
- **SQLite** - Local database for frontend data operations
- **Backend.js** - CRUD operations handler for SQLite

### Backend
- **Google Apps Script** - Server-side logic and API endpoints
- **Google Sheets** - Primary database for data persistence
- **Authentication** - Employee code-based login system

## System Architecture

### User Roles & Access Levels
1. **Admin** - Full system access and time window configuration
2. **Approval Manager1** - Department-level approvals
3. **Approval Manager2** - Division-level approvals  
4. **HR Manager1** - HR operations and reviews
5. **HR Manager2** - Senior HR approvals
6. **Individual User** - Self-service performance management

### Employee Details Section
Capture and display:
- Employee Code (Primary Key)
- Name
- Division
- Designation
- Location
- Department

### SMART Goals Management System

#### Time-Based Window Activation

**August - September Window: KRA + KPI Setting**
- Open for all users to input
- Editable fields:
  - Key Result Areas (KRA) SMART Goals (Min: 4, Max: 5)
  - Key Performance Indicators (KPI) per KRA (Min: 2, Max: 3)
  - Measurement Criteria (at 100% level) - Target Set
  - %age Weightage of KRA (Min: 4% per KRA)

**November - December Window: Mid Year Review**
- Previous inputs become read-only
- Editable field: Mid Year Review (Dropdown: NS/BT/OT/AT/C)
- All KRA+KPI data visible but locked

**Year End Window: Final Achievement**
- Editable field: Confirmed Achieved Ratio (Dropdown: 25%, 50%, 75%, 100%, 125%)
- Auto-calculate: Weight × Achieved Ratio
- Previous data remains visible but locked

### Behavioural Competency Section

#### Activation Window
- **Year End Window Only**: Available during final review period
- Accessible to reviewers with appropriate authorization levels

#### Structure & Components

**Competency Framework:**
- **Competency Column**: Pre-defined competency categories (system-configured)
- **Behaviour Demonstrated Column**: Reviewer can add exactly 2 behaviour demonstrations per competency
- **Score Column**: Dropdown selection (5, 4, 3, 2, 1) for each behaviour demonstrated
- **Competency Score Total**: Auto-calculated average of all scores within each competency
- **Other Remarks**: Optional free-text field for additional comments

#### Behavioural Competency Data Model
```
Competency Categories (Pre-configured):
- Leadership & Vision
- Communication & Collaboration  
- Problem Solving & Innovation
- Customer Focus & Service Excellence
- Professional Development & Learning
- Integrity & Ethics
- Adaptability & Change Management
- Team Building & Mentoring
```

#### Scoring Mechanism
- **Individual Behaviour Score**: 5 (Outstanding) to 1 (Needs Improvement)
- **Competency Score Calculation**: Average of 2 behaviour scores per competency
- **Overall Behavioural Score**: Average of all competency scores
- **Score Weightage**: Configurable percentage contribution to overall performance rating

#### Input Validation Rules
- Exactly 2 behaviour demonstrations required per competency
- All behaviour demonstrations must have scores assigned
- Score dropdown validation (1-5 range only)
- Optional remarks field (max 500 characters)
- Auto-save functionality for partial completions

## Validation Rules

### SMART Goals Constraints
- Minimum 4 SMART Goals, Maximum 5
- Each SMART Goal must have 2-3 KPIs
- Total weightage across all KRAs ≤ 100%
- Minimum weightage per KRA: 4%

### Behavioural Competency Constraints
- Exactly 2 behaviour demonstrations per competency required
- Score selection mandatory for each behaviour (1-5 scale)
- Competency score auto-calculated (cannot be manually overridden)
- Other remarks optional but limited to 500 characters

### Input Field Types
- **Text Inputs**: KRA SMART Goals, KPIs, Measurement Criteria, Behaviour Demonstrated, Other Remarks
- **Percentage Inputs**: %age Weightage (with validation)
- **Dropdown**: Mid Year Review (NS/BT/OT/AT/C)
- **Dropdown**: Confirmed Achieved Ratio (25%, 50%, 75%, 100%, 125%)
- **Dropdown**: Behaviour Scores (5, 4, 3, 2, 1)
- **Calculated Fields**: Weight × Achieved Ratio, Competency Score Totals (auto-computed)

## Database Schema

### Google Sheets Structure
```
Employees Sheet:
- emp_code, name, division, designation, location, department, user_type

Goals Sheet:
- goal_id, emp_code, kra_title, kpi_description, measurement_criteria, 
  weightage, mid_year_review, achieved_ratio, calculated_score, 
  created_date, updated_date

Behavioural_Competencies Sheet:
- competency_id, emp_code, competency_name, behaviour_1, behaviour_1_score,
  behaviour_2, behaviour_2_score, competency_total_score, other_remarks,
  reviewer_emp_code, created_date, updated_date

Competency_Master Sheet:
- competency_id, competency_name, competency_description, is_active, sort_order

System_Config Sheet:
- setting_name, setting_value, effective_date
```

### SQLite Frontend Structure
```sql
CREATE TABLE employees (
    emp_code TEXT PRIMARY KEY,
    name TEXT,
    division TEXT,
    designation TEXT,
    location TEXT,
    department TEXT,
    user_type TEXT
);

CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_code TEXT,
    kra_title TEXT,
    kpi_description TEXT,
    measurement_criteria TEXT,
    weightage INTEGER,
    mid_year_review TEXT,
    achieved_ratio INTEGER,
    calculated_score REAL,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (emp_code) REFERENCES employees(emp_code)
);

CREATE TABLE behavioural_competencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_code TEXT,
    competency_name TEXT,
    behaviour_1 TEXT,
    behaviour_1_score INTEGER,
    behaviour_2 TEXT,
    behaviour_2_score INTEGER,
    competency_total_score REAL,
    other_remarks TEXT,
    reviewer_emp_code TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (emp_code) REFERENCES employees(emp_code)
);

CREATE TABLE competency_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competency_name TEXT UNIQUE,
    competency_description TEXT,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER
);

CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT UNIQUE,
    setting_value TEXT,
    effective_date DATE
);
```

## Frontend Requirements

### Login System
- Employee code-based authentication
- Role-based dashboard rendering
- Session management with local storage
- Redirect based on user type

### Dynamic UI Components
- **Employee Profile Section** - Auto-populated from database
- **SMART Goals Grid** - Dynamic addition/removal of goals and KPIs
- **Behavioural Competency Matrix** - Dynamic competency evaluation interface
- **Progress Tracking** - Visual indicators for completion status
- **Admin Panel** - Time window configuration interface
- **Approval Workflows** - Manager-specific review interfaces

### Responsive Design Features
- Mobile-first approach
- Progressive disclosure of information
- Accessible form controls
- Print-friendly layouts for reports

### JavaScript Functionality
- Real-time validation of weightage totals
- Dynamic form field generation
- Competency score auto-calculation
- AJAX calls to Google Apps Script
- Local SQLite synchronization
- Export functionality (PDF/Excel)

## Backend Requirements

### Google Apps Script Functions
```javascript
// Core Functions Needed:
- authenticateUser(empCode)
- getEmployeeDetails(empCode)
- saveGoalsData(empCode, goalsArray)
- getGoalsData(empCode)
- saveBehaviouralCompetencies(empCode, competenciesArray)
- getBehaviouralCompetencies(empCode)
- getCompetencyMaster()
- updateSystemSettings(settings)
- getActiveTimeWindow()
- exportReports(filters)
- calculateOverallPerformanceScore(empCode)
```

### API Endpoints Structure
```
POST /auth - User authentication
GET /employee/:empCode - Get employee details
GET /goals/:empCode - Retrieve goals for employee
POST /goals/:empCode - Save/update goals
PUT /goals/:empCode - Update existing goals
GET /competencies/:empCode - Retrieve behavioural competencies
POST /competencies/:empCode - Save/update behavioural competencies
GET /competencies/master - Get competency master data
GET /system/timewindow - Get current active window
POST /system/settings - Update system settings (Admin only)
GET /reports/export - Generate reports
GET /performance/overall/:empCode - Get combined performance score
```

## Security & Data Protection
- Input sanitization and validation
- SQL injection prevention
- Role-based access control enforcement
- Audit trail for all data modifications
- Data backup and recovery procedures

## User Experience Features
- **Auto-save functionality** - Prevent data loss
- **Progress indicators** - Show completion status  
- **Dynamic Section Display** - Time-window based visibility control
- **Live Rating Updates** - Real-time final rating calculation and display
- **Visual Rating Elements** - Animated stars, circular medals, color-coded ratings
- **Validation feedback** - Real-time error messages
- **Guided workflows** - Step-by-step goal setting and competency evaluation
- **Contextual help** - Tooltips and guidance text
- **Score calculation preview** - Live updates of competency totals and final ratings
- **Completion Tracking** - Section-wise progress monitoring

## Performance Optimization
- Lazy loading of data
- Efficient database queries
- Client-side caching
- Minimal API calls
- Optimized asset delivery

## Testing Requirements
- Unit tests for validation logic
- Integration tests for API endpoints  
- Cross-browser compatibility testing
- Mobile responsiveness testing
- Performance benchmarking
- Competency calculation accuracy testing

## Deployment Specifications
- **Frontend**: Deployable to any web server
- **SQLite Database**: Shared network drive access
- **Google Apps Script**: Published as web app
- **Configuration**: Environment-specific settings

## Success Metrics
- Page load time < 3 seconds
- Form submission success rate > 99%
- Mobile usability score > 90
- User adoption rate tracking
- Data accuracy validation
- Competency evaluation completion rate > 95%

## Reporting & Analytics
- **Performance Summary Reports** - Combined SMART Goals and Behavioural Competency scores
- **Competency Analysis** - Department/Division-wise behavioural trends
- **Goal Achievement Tracking** - KRA/KPI completion rates
- **Comparative Analysis** - Year-over-year performance trends
- **Export Capabilities** - PDF certificates, Excel dashboards, CSV data exports

This enhanced system provides comprehensive performance evaluation combining quantitative goal achievement with qualitative behavioural assessment, ensuring holistic employee development and fair performance measurement.
