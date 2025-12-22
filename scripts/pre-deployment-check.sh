#!/bin/bash

# Pre-Deployment Verification Script
# Runs comprehensive checks before deploying Appointments system
# Usage: ./scripts/pre-deployment-check.sh [staging|production]

set -e

ENV=${1:-staging}
PASS=0
FAIL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Appointments System: Pre-Deployment Check${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print test result
test_result() {
  local test_name=$1
  local result=$2

  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✅${NC} $test_name"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $test_name"
    ((FAIL++))
  fi
}

# Function to check file exists
check_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    test_result "$description" 0
  else
    test_result "$description (missing: $file)" 1
  fi
}

# Function to check env variable
check_env() {
  local var=$1

  if [ -z "${!var}" ]; then
    test_result "Environment variable: $var" 1
  else
    test_result "Environment variable: $var is set" 0
  fi
}

echo -e "${BLUE}[1/6] Code Quality Checks${NC}"
echo "---"

# Check git status
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  if [ -z "$(git status --porcelain)" ]; then
    test_result "Git working tree is clean" 0
  else
    test_result "Git working tree is clean" 1
  fi
else
  test_result "Git repository detected" 1
fi

# Check build
echo "Building application..."
if pnpm build > /tmp/build.log 2>&1; then
  test_result "Application builds successfully" 0
else
  test_result "Application builds successfully" 1
  echo -e "${YELLOW}Build output:${NC}"
  tail -20 /tmp/build.log
fi

# Check TypeScript
echo "Type checking..."
if pnpm typecheck > /tmp/typecheck.log 2>&1; then
  test_result "TypeScript type checking passes" 0
else
  test_result "TypeScript type checking passes" 1
  echo -e "${YELLOW}Type check output:${NC}"
  tail -10 /tmp/typecheck.log
fi

echo ""
echo -e "${BLUE}[2/6] File Existence Checks${NC}"
echo "---"

check_file "apps/api/package.json" "API package.json exists"
check_file "apps/web/package.json" "Web package.json exists"
check_file "apps/api/prisma/schema.prisma" "Prisma schema exists"
check_file ".env.example" "Environment template exists"
check_file "DEPLOYMENT_TESTING_GUIDE.md" "Testing guide exists"
check_file "DEPLOYMENT_ENV_REFERENCE.md" "Environment reference exists"

echo ""
echo -e "${BLUE}[3/6] Database Checks${NC}"
echo "---"

# Check database URL
if [ ! -z "$DATABASE_URL" ]; then
  test_result "DATABASE_URL environment variable set" 0

  # Try to connect (if postgresql is available)
  if command -v psql &> /dev/null; then
    if psql -d "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
      test_result "Database connection successful" 0
    else
      test_result "Database connection successful" 1
    fi
  else
    test_result "Database connection (psql not available, skipped)" 0
  fi
else
  test_result "DATABASE_URL environment variable set" 1
fi

echo ""
echo -e "${BLUE}[4/6] Environment Configuration Checks${NC}"
echo "---"

# Check required environment variables
case $ENV in
  staging|production)
    check_env "DATABASE_URL"
    check_env "SESSION_SECRET"
    check_env "SMTP_HOST"
    check_env "SMTP_PORT"
    check_env "SMTP_USER"
    check_env "SMTP_PASS"
    check_env "EMAIL_FROM"
    check_env "TEAMS_CLIENT_ID"
    check_env "TEAMS_CLIENT_SECRET"
    check_env "TEAMS_TENANT_ID"
    check_env "MEETING_PROVIDER"
    check_env "CORS_ORIGIN"

    # Check session secret is not default
    if [ "$SESSION_SECRET" != "dev_secret_change_in_staging_and_production" ]; then
      test_result "SESSION_SECRET is changed from default" 0
    else
      test_result "SESSION_SECRET is changed from default" 1
    fi

    # Check NODE_ENV is set
    if [ "$NODE_ENV" == "production" ] || [ "$NODE_ENV" == "staging" ]; then
      test_result "NODE_ENV set to $NODE_ENV" 0
    else
      test_result "NODE_ENV set to production/staging" 1
    fi
    ;;
  *)
    echo -e "${YELLOW}Unknown environment: $ENV${NC}"
    ;;
esac

echo ""
echo -e "${BLUE}[5/6] Dependency Checks${NC}"
echo "---"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  test_result "Node.js installed ($NODE_VERSION)" 0
else
  test_result "Node.js installed" 1
fi

# Check npm/pnpm
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  test_result "pnpm installed ($PNPM_VERSION)" 0
else
  test_result "pnpm installed" 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
  PG_VERSION=$(psql --version)
  test_result "PostgreSQL client installed ($PG_VERSION)" 0
else
  test_result "PostgreSQL client installed (optional)" 0
fi

echo ""
echo -e "${BLUE}[6/6] Code Standards Checks${NC}"
echo "---"

# Check for console.logs in production code
if [ "$ENV" == "production" ]; then
  CONSOLE_LOGS=$(grep -r "console\.log" apps/api/src apps/web/src 2>/dev/null | wc -l)
  if [ $CONSOLE_LOGS -eq 0 ]; then
    test_result "No console.logs in production code" 0
  else
    test_result "No console.logs in production code ($CONSOLE_LOGS found)" 1
  fi
fi

# Check for TODO comments
TODOS=$(grep -r "TODO\|FIXME" apps/api/src apps/web/src 2>/dev/null | wc -l)
if [ $TODOS -eq 0 ]; then
  test_result "No TODO/FIXME comments" 0
else
  test_result "No TODO/FIXME comments ($TODOS found - review before deploy)" 1
fi

# Check for hardcoded secrets
HARDCODED=$(grep -r "password\|secret\|token" apps/api/src apps/web/src 2>/dev/null | grep -i "=\s*['\"]" | wc -l)
if [ $HARDCODED -eq 0 ]; then
  test_result "No hardcoded secrets in code" 0
else
  test_result "No hardcoded secrets in code ($HARDCODED potential issues found)" 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review DEPLOYMENT_TESTING_GUIDE.md for testing procedures"
  echo "2. Ensure staging environment is set up"
  echo "3. Run test suite (if available): pnpm test"
  echo "4. Perform manual testing following the guide"
  echo "5. Deploy to production when ready"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}❌ Pre-deployment checks failed!${NC}"
  echo ""
  echo "Issues found:"
  echo "1. Review errors above"
  echo "2. Fix configuration or code issues"
  echo "3. Re-run this script: ./scripts/pre-deployment-check.sh $ENV"
  echo ""
  exit 1
fi
