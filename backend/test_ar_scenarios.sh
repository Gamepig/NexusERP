#!/bin/bash

# Accounts Receivable API Test Scenarios
# This script tests various AR query scenarios and performance

set -e

echo "🧪 Accounts Receivable API Test Scenarios"
echo "=========================================="

# Configuration
BASE_URL="${1:-http://localhost:8080}"
echo "🌐 Testing against: $BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "$auth_header" \
             -d "$data" \
             "$BASE_URL$endpoint"
    else
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "$auth_header" \
             "$BASE_URL$endpoint"
    fi
}

# Function to test API endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    
    echo -n "Testing $name... "
    
    local start_time=$(date +%s%3N)
    local response=$(make_request "$method" "$endpoint" "$data" "$AUTH_HEADER")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        echo -e "${RED}FAILED${NC} (${duration}ms)"
        echo "  Error: $(echo "$response" | jq -r '.error // .message // "Unknown error"')"
        return 1
    else
        echo -e "${GREEN}PASSED${NC} (${duration}ms)"
        return 0
    fi
}

# Function to login and get token
login() {
    echo "🔐 Authenticating..."
    
    local login_data='{
        "username": "admin",
        "password": "admin123"
    }'
    
    local response=$(make_request "POST" "/api/auth/login" "$login_data" "")
    
    if echo "$response" | grep -q '"token"'; then
        local token=$(echo "$response" | jq -r '.data.token')
        AUTH_HEADER="Authorization: Bearer $token"
        echo -e "${GREEN}✅ Authentication successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Authentication failed${NC}"
        echo "Response: $response"
        exit 1
    fi
}

# Function to test performance with different page sizes
test_pagination_performance() {
    echo -e "\n${BLUE}📄 Testing Pagination Performance${NC}"
    
    local page_sizes=(10 50 100 500)
    
    for size in "${page_sizes[@]}"; do
        echo -n "  Page size $size... "
        
        local start_time=$(date +%s%3N)
        local response=$(make_request "GET" "/api/accounts-receivable?page=1&limit=$size" "" "$AUTH_HEADER")
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"data"'; then
            local count=$(echo "$response" | jq '.data | length')
            echo -e "${GREEN}OK${NC} - $count records (${duration}ms)"
        else
            echo -e "${RED}FAILED${NC} (${duration}ms)"
        fi
    done
}

# Function to test different filter combinations
test_filter_combinations() {
    echo -e "\n${BLUE}🔍 Testing Filter Combinations${NC}"
    
    # Test status filters
    local statuses=("open" "partially_paid" "overdue" "paid")
    
    for status in "${statuses[@]}"; do
        echo -n "  Status filter: $status... "
        
        local start_time=$(date +%s%3N)
        local response=$(make_request "GET" "/api/accounts-receivable?status=$status&limit=5" "" "$AUTH_HEADER")
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"data"'; then
            local count=$(echo "$response" | jq '.data | length')
            echo -e "${GREEN}OK${NC} - $count records (${duration}ms)"
        else
            echo -e "${RED}FAILED${NC} (${duration}ms)"
        fi
    done
    
    # Test date range filters
    echo -n "  Date range filter... "
    local start_date=$(date -d "30 days ago" +%Y-%m-%d)
    local end_date=$(date +%Y-%m-%d)
    
    local start_time=$(date +%s%3N)
    local response=$(make_request "GET" "/api/accounts-receivable?start_date=$start_date&end_date=$end_date&limit=10" "" "$AUTH_HEADER")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if echo "$response" | grep -q '"data"'; then
        local count=$(echo "$response" | jq '.data | length')
        echo -e "${GREEN}OK${NC} - $count records (${duration}ms)"
    else
        echo -e "${RED}FAILED${NC} (${duration}ms)"
    fi
}

# Function to test customer balance scenarios
test_customer_balance_scenarios() {
    echo -e "\n${BLUE}💰 Testing Customer Balance Scenarios${NC}"
    
    # Test different customer IDs (assuming they exist)
    local customer_ids=(1 2 3)
    
    for customer_id in "${customer_ids[@]}"; do
        echo -n "  Customer $customer_id balance summary... "
        
        local start_time=$(date +%s%3N)
        local response=$(make_request "GET" "/api/customers/$customer_id/balance" "" "$AUTH_HEADER")
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"total_balance"'; then
            local balance=$(echo "$response" | jq '.data.total_balance')
            echo -e "${GREEN}OK${NC} - Balance: $balance (${duration}ms)"
        elif echo "$response" | grep -q '"error"'; then
            echo -e "${YELLOW}SKIPPED${NC} - Customer not found (${duration}ms)"
        else
            echo -e "${RED}FAILED${NC} (${duration}ms)"
        fi
        
        # Test detailed balance
        echo -n "  Customer $customer_id detailed balance... "
        
        local start_time=$(date +%s%3N)
        local response=$(make_request "GET" "/api/customers/$customer_id/balance?detailed=true" "" "$AUTH_HEADER")
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"total_balance"' && echo "$response" | grep -q '"current_balance"'; then
            local total=$(echo "$response" | jq '.data.total_balance')
            local current=$(echo "$response" | jq '.data.current_balance')
            local overdue=$(echo "$response" | jq '.data.overdue_balance')
            echo -e "${GREEN}OK${NC} - Total: $total, Current: $current, Overdue: $overdue (${duration}ms)"
        elif echo "$response" | grep -q '"error"'; then
            echo -e "${YELLOW}SKIPPED${NC} - Customer not found (${duration}ms)"
        else
            echo -e "${RED}FAILED${NC} (${duration}ms)"
        fi
    done
}

# Function to test aging report scenarios
test_aging_report_scenarios() {
    echo -e "\n${BLUE}📊 Testing Aging Report Scenarios${NC}"
    
    # Test overall aging report
    echo -n "  Overall aging report... "
    
    local start_time=$(date +%s%3N)
    local response=$(make_request "GET" "/api/accounts-receivable/aging-report" "" "$AUTH_HEADER")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if echo "$response" | grep -q '"summary"' && echo "$response" | grep -q '"items"'; then
        local total_customers=$(echo "$response" | jq '.data.summary.total_customers')
        local total_balance=$(echo "$response" | jq '.data.summary.total_balance')
        echo -e "${GREEN}OK${NC} - $total_customers customers, total: $total_balance (${duration}ms)"
    else
        echo -e "${RED}FAILED${NC} (${duration}ms)"
    fi
    
    # Test customer-specific aging report
    echo -n "  Customer-specific aging report... "
    
    local start_time=$(date +%s%3N)
    local response=$(make_request "GET" "/api/accounts-receivable/aging-report?customer_id=1" "" "$AUTH_HEADER")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if echo "$response" | grep -q '"summary"'; then
        local total_customers=$(echo "$response" | jq '.data.summary.total_customers')
        echo -e "${GREEN}OK${NC} - $total_customers customers in report (${duration}ms)"
    else
        echo -e "${RED}FAILED${NC} (${duration}ms)"
    fi
}

# Function to test error handling
test_error_handling() {
    echo -e "\n${BLUE}⚠️  Testing Error Handling${NC}"
    
    # Test invalid AR ID
    echo -n "  Invalid AR ID (999999)... "
    local response=$(make_request "GET" "/api/accounts-receivable/999999" "" "$AUTH_HEADER")
    if echo "$response" | grep -q '"error"'; then
        echo -e "${GREEN}OK${NC} - Proper error response"
    else
        echo -e "${RED}FAILED${NC} - Expected error response"
    fi
    
    # Test invalid customer ID for balance
    echo -n "  Invalid customer ID for balance (999999)... "
    local response=$(make_request "GET" "/api/customers/999999/balance" "" "$AUTH_HEADER")
    if echo "$response" | grep -q '"error"'; then
        echo -e "${GREEN}OK${NC} - Proper error response"
    else
        echo -e "${RED}FAILED${NC} - Expected error response"
    fi
    
    # Test invalid date format
    echo -n "  Invalid date format... "
    local response=$(make_request "GET" "/api/accounts-receivable?start_date=invalid-date" "" "$AUTH_HEADER")
    if echo "$response" | grep -q '"data"'; then
        echo -e "${GREEN}OK${NC} - Gracefully handled invalid date"
    else
        echo -e "${YELLOW}WARNING${NC} - Unexpected response to invalid date"
    fi
}

# Main test execution
main() {
    echo "Starting AR API tests..."
    
    # Login first
    login
    
    # Run basic endpoint tests
    echo -e "\n${BLUE}🧪 Basic Endpoint Tests${NC}"
    test_endpoint "AR List" "GET" "/api/accounts-receivable?limit=5" 200
    test_endpoint "AR by ID (1)" "GET" "/api/accounts-receivable/1" 200
    test_endpoint "Customer Balance (1)" "GET" "/api/customers/1/balance" 200
    test_endpoint "Outstanding AR (1)" "GET" "/api/customers/1/outstanding-ar" 200
    test_endpoint "Aging Report" "GET" "/api/accounts-receivable/aging-report" 200
    test_endpoint "Update Aging Buckets" "POST" "/api/accounts-receivable/update-aging" 200
    
    # Run performance and scenario tests
    test_pagination_performance
    test_filter_combinations
    test_customer_balance_scenarios
    test_aging_report_scenarios
    test_error_handling
    
    echo -e "\n${GREEN}🎉 AR API tests completed!${NC}"
}

# Check dependencies
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        exit 1
    fi
}

# Run the tests
check_dependencies
main