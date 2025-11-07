#!/bin/bash

# Lead Capture Form Builder - Integration Test Suite (Phase 4)
# Tests core functionality of the inquiry system

API_URL="http://localhost:3001"
PASS=0
FAIL=0
TESTS=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}🧪 Lead Capture Form Builder - Integration Tests${NC}"
echo "=================================================="
echo ""

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local body="$4"
    local expected_status="$5"

    TESTS=$((TESTS + 1))

    if [ -z "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$body")
    fi

    status=$(echo "$response" | tail -n1)
    body_response=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name (HTTP $status)"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $name (Expected HTTP $expected_status, got HTTP $status)"
        FAIL=$((FAIL + 1))
        echo "   Response: $body_response"
    fi
}

# API Connectivity Tests
echo "API Connectivity Tests:"
test_endpoint "Health Check" "GET" "/healthz" "" "200"
test_endpoint "Readiness Check" "GET" "/readyz" "" "200"

echo ""
echo "Core Functionality Tests:"

# Test 1: Complete form submission
test_endpoint "Complete Inquiry Submission" "POST" "/inquiries/create" \
    '{
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+44 123 456 7890",
        "company": "ABC Events",
        "inquiryType": "WEDDING",
        "shootDate": "2025-06-15T00:00:00Z",
        "shootDescription": "Wedding photography for 200 guests with reception coverage and same-day edit",
        "location": "London, UK",
        "specialRequirements": "Aerial drone shots, videography",
        "budgetMin": 2000,
        "budgetMax": 5000,
        "attachmentUrls": [],
        "attachmentCount": 0,
        "tags": ["wedding", "high-value"]
    }' "201"

# Test 2: All inquiry types
echo ""
echo "Testing All Inquiry Types:"
for type in WEDDING PORTRAIT COMMERCIAL EVENT FAMILY PRODUCT REAL_ESTATE HEADSHOT OTHER; do
    test_endpoint "Create $type Inquiry" "POST" "/inquiries/create" \
        "{
            \"fullName\": \"User $type\",
            \"email\": \"test.$type@example.com\",
            \"phone\": \"+1234567890\",
            \"inquiryType\": \"$type\",
            \"shootDescription\": \"Test inquiry for $type photography service\"
        }" "201"
done

# Test 3: Form validation tests
echo ""
echo "Form Validation Tests:"

test_endpoint "Reject: Empty Full Name" "POST" "/inquiries/create" \
    '{
        "fullName": "",
        "email": "test@example.com",
        "phone": "+1234567890",
        "inquiryType": "PORTRAIT",
        "shootDescription": "Test description"
    }' "400"

test_endpoint "Reject: Invalid Email" "POST" "/inquiries/create" \
    '{
        "fullName": "Test User",
        "email": "invalid-email",
        "phone": "+1234567890",
        "inquiryType": "PORTRAIT",
        "shootDescription": "Test description"
    }' "400"

test_endpoint "Reject: Missing Phone" "POST" "/inquiries/create" \
    '{
        "fullName": "Test User",
        "email": "test@example.com",
        "phone": "",
        "inquiryType": "PORTRAIT",
        "shootDescription": "Test description"
    }' "400"

test_endpoint "Reject: Description Too Short" "POST" "/inquiries/create" \
    '{
        "fullName": "Test User",
        "email": "test@example.com",
        "phone": "+1234567890",
        "inquiryType": "PORTRAIT",
        "shootDescription": "Too"
    }' "400"

# Test 4: Budget range tests
echo ""
echo "Budget Range Tests:"

test_endpoint "Budget: Under 500" "POST" "/inquiries/create" \
    '{
        "fullName": "Budget User",
        "email": "budget.under500@example.com",
        "phone": "+1234567890",
        "inquiryType": "PORTRAIT",
        "shootDescription": "Budget test inquiry",
        "budgetMin": null,
        "budgetMax": 500
    }' "201"

test_endpoint "Budget: 5000+" "POST" "/inquiries/create" \
    '{
        "fullName": "Budget User",
        "email": "budget.5000plus@example.com",
        "phone": "+1234567890",
        "inquiryType": "COMMERCIAL",
        "shootDescription": "High budget test inquiry",
        "budgetMin": 5000,
        "budgetMax": null
    }' "201"

# Test 5: Duplicate emails
echo ""
echo "Duplicate Email Test:"

test_endpoint "First Submission (Duplicate Email)" "POST" "/inquiries/create" \
    '{
        "fullName": "First User",
        "email": "duplicate@example.com",
        "phone": "+1111111111",
        "inquiryType": "WEDDING",
        "shootDescription": "First inquiry test description"
    }' "201"

test_endpoint "Second Submission (Same Email)" "POST" "/inquiries/create" \
    '{
        "fullName": "Second User",
        "email": "duplicate@example.com",
        "phone": "+2222222222",
        "inquiryType": "PORTRAIT",
        "shootDescription": "Second inquiry test description"
    }' "201"

# Summary
echo ""
echo "=================================================="
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "=================================================="
echo ""
echo "Total Tests:  $TESTS"
echo -e "${GREEN}✅ Passed:    $PASS${NC}"
echo -e "${RED}❌ Failed:    $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
