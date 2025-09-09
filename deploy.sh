#!/bin/bash

# Performance Management System - Quick Deploy Script
# This script helps you quickly set up the repository on GitHub

echo "🚀 Performance Management System - Repository Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Before running this script, make sure you have:${NC}"
echo "   1. Created a new repository on GitHub"
echo "   2. Copied the repository URL"
echo ""

# Get repository URL from user
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo-name.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required${NC}"
    exit 1
fi

# Extract repository name from URL
REPO_NAME=$(basename "$REPO_URL" .git)

echo -e "${YELLOW}🔄 Setting up repository...${NC}"

# Clone the repository
if git clone "$REPO_URL" "../$REPO_NAME"; then
    echo -e "${GREEN}✅ Repository cloned successfully${NC}"
else
    echo -e "${RED}❌ Failed to clone repository${NC}"
    exit 1
fi

# Copy files to the repository
echo -e "${YELLOW}📁 Copying files...${NC}"

# Create directory structure
mkdir -p "../$REPO_NAME/css"
mkdir -p "../$REPO_NAME/js"

# Copy all files
cp index.html "../$REPO_NAME/"
cp README.md "../$REPO_NAME/"
cp CHANGELOG.md "../$REPO_NAME/"
cp SETUP_INSTRUCTIONS.md "../$REPO_NAME/"
cp package.json "../$REPO_NAME/"
cp .gitignore "../$REPO_NAME/" 2>/dev/null || echo "# Generated .gitignore" > "../$REPO_NAME/.gitignore"

# Copy CSS files
cp css/*.css "../$REPO_NAME/css/"

# Copy JS files
cp js/*.js "../$REPO_NAME/js/"

echo -e "${GREEN}✅ Files copied successfully${NC}"

# Change to repository directory
cd "../$REPO_NAME"

# Create and switch to the feature branch
echo -e "${YELLOW}🌿 Creating branch...${NC}"
git checkout -b kra-cursor-structure-frontend-with-modular-js-and-css-1bd4

# Add all files
git add .

# Commit with detailed message
echo -e "${YELLOW}💾 Committing files...${NC}"
git commit -m "Complete Performance Management System

- Modular JavaScript architecture with separate files
- Responsive CSS with multiple themes  
- Role-based authentication system
- SMART Goals management (KRA & KPI)
- Behavioural Competency evaluation
- Achievement tracking with time windows
- Admin panels for user and system management
- Offline support with local storage
- Mobile-first responsive design

Features:
- datahandle.js: API connections, CRUD, SQLite operations
- Auth.js: Authentication with dummy users for testing
- KRA_KPI_Setting.js: Goals management module
- ActualAchievement.js: Achievement tracking module
- BehaviouralCompetency.js: Competency evaluation module
- UserRolesSetting.js: User management (Admin only)
- System_Config.js: System configuration (Admin only)
- app.js: Main application controller

Ready for immediate testing with dummy login credentials:
ADM001, MGR001, HR001, EMP001, EMP002"

# Push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
if git push origin kra-cursor-structure-frontend-with-modular-js-and-css-1bd4; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${BLUE}🎉 Repository setup complete!${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Open index.html in your browser"
    echo "2. Login with: ADM001, MGR001, HR001, EMP001, or EMP002"
    echo "3. Test all features and modules"
    echo ""
    echo -e "${BLUE}Repository URL:${NC} $REPO_URL"
    echo -e "${BLUE}Branch:${NC} kra-cursor-structure-frontend-with-modular-js-and-css-1bd4"
    echo ""
    echo -e "${GREEN}🚀 Your Performance Management System is ready!${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "Please check your repository permissions and try again"
    exit 1
fi