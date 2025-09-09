# Performance Management System

A comprehensive web-based Performance Management System with SMART Goals tracking, Behavioural Competency evaluation, and role-based access control.

## Features

- **SMART Goals Management** - Set and track KRA and KPI
- **Behavioural Competency Evaluation** - Assess competencies with scoring
- **Actual Achievement Tracking** - Mid-year and final evaluations
- **Role-Based Access Control** - Admin, Manager, HR, and User roles
- **Time Window Management** - Configurable activity periods
- **Offline Support** - Works without internet connection
- **Responsive Design** - Mobile-first approach
- **Multiple Themes** - Light, Dark, Corporate themes
- **Data Export** - CSV, JSON, PDF formats

## Project Structure

```
/workspace/
├── index.html              # Main HTML file
├── css/                    # Styling files
│   ├── main.css           # Core styles
│   ├── components.css     # UI components
│   ├── responsive.css     # Mobile styles
│   └── themes.css         # Theme variations
├── js/                    # JavaScript modules
│   ├── app.js            # Main controller
│   ├── datahandle.js     # API and CRUD operations
│   ├── Auth.js           # Authentication
│   ├── KRA_KPI_Setting.js    # Goals management
│   ├── ActualAchievement.js  # Achievement tracking
│   ├── BehaviouralCompetency.js # Competency evaluation
│   ├── UserRolesSetting.js   # User management
│   └── System_Config.js      # System configuration
└── README.md              # Documentation
```

## Getting Started

1. Open `index.html` in a web browser
2. Login with demo codes: ADM001, MGR001, HR001, EMP001
3. Configure Google Apps Script backend (optional)
4. Set up time windows and user roles

## User Roles

- **Administrator**: Full system access and configuration
- **Approval Manager**: Department/Division approvals
- **HR Manager**: HR operations and reports
- **Individual User**: Self-service performance management

## Time Windows

- **KRA & KPI Setting**: August - September
- **Mid-Year Review**: November - December
- **Year-End Evaluation**: December - January
- **Competency Evaluation**: Year-End only

## Technical Details

- Pure HTML, CSS, JavaScript (no frameworks)
- Local SQLite-like storage using localStorage
- Google Apps Script backend integration
- Mobile-responsive design
- Offline-first architecture

---

**Version**: 1.0.0 | **License**: Proprietary