#!/bin/bash

# NexusERP Integration Testing Script
# This script sets up sandbox environment and runs comprehensive integration tests

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SANDBOX_ENV_FILE="$PROJECT_ROOT/.env.sandbox"
RESULTS_DIR="$PROJECT_ROOT/test-results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -q, --quick             Run quick tests only (skip external API tests)
    -c, --cleanup           Cleanup sandbox environment after tests
    -r, --report            Generate detailed test report
    -v, --verbose           Verbose output
    --skip-setup           Skip environment setup
    --skip-tests           Skip running tests (setup only)

Examples:
    $0                      Run full integration tests
    $0 -q                   Run quick tests only
    $0 -c                   Run tests and cleanup
    $0 --skip-setup         Run tests on existing environment

EOF
}

# Parse command line arguments
QUICK_MODE=false
CLEANUP=false
GENERATE_REPORT=false
VERBOSE=false
SKIP_SETUP=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -q|--quick)
            QUICK_MODE=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
            ;;
        -r|--report)
            GENERATE_REPORT=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Use docker compose if available, otherwise use docker-compose
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    log_success "Prerequisites check passed"
}

# Setup sandbox environment
setup_sandbox() {
    if [[ "$SKIP_SETUP" == "true" ]]; then
        log_info "Skipping sandbox setup"
        return
    fi
    
    log_info "Setting up sandbox environment..."
    
    # Create sandbox environment file if it doesn't exist
    if [[ ! -f "$SANDBOX_ENV_FILE" ]]; then
        log_info "Creating sandbox environment file..."
        cp "$PROJECT_ROOT/.env.example" "$SANDBOX_ENV_FILE"
        
        # Update environment for sandbox
        sed -i.bak 's/APP_ENV=development/APP_ENV=sandbox/g' "$SANDBOX_ENV_FILE"
        sed -i.bak 's/DB_DATABASE=nexus_erp/DB_DATABASE=nexus_erp_sandbox/g' "$SANDBOX_ENV_FILE"
        sed -i.bak 's/DB_PASSWORD=password/DB_PASSWORD=sandbox_password/g' "$SANDBOX_ENV_FILE"
        
        rm "$SANDBOX_ENV_FILE.bak"
        
        log_warning "Please update $SANDBOX_ENV_FILE with your sandbox API keys"
    fi
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Pull latest images
    log_info "Pulling latest Docker images..."
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE -f docker-compose.sandbox.yml pull --quiet
    
    # Start sandbox environment
    log_info "Starting sandbox environment..."
    $DOCKER_COMPOSE -f docker-compose.sandbox.yml up -d postgres-sandbox redis-sandbox
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Sandbox environment is ready"
}

# Check service health
check_service_health() {
    log_info "Checking service health..."
    
    # Check PostgreSQL
    if ! $DOCKER_COMPOSE -f docker-compose.sandbox.yml exec -T postgres-sandbox pg_isready -U postgres &> /dev/null; then
        log_error "PostgreSQL is not ready"
        exit 1
    fi
    
    # Check Redis
    if ! $DOCKER_COMPOSE -f docker-compose.sandbox.yml exec -T redis-sandbox redis-cli -a sandbox_redis_password ping &> /dev/null; then
        log_error "Redis is not ready"
        exit 1
    fi
    
    log_success "All services are healthy"
}

# Run integration tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_info "Skipping tests"
        return
    fi
    
    log_info "Running integration tests..."
    
    cd "$PROJECT_ROOT"
    
    # Set test environment variables
    export APP_ENV=testing
    export DB_HOST=localhost
    export DB_PORT=5433
    export DB_DATABASE=nexus_erp_sandbox
    export DB_USERNAME=postgres
    export DB_PASSWORD=sandbox_password
    export REDIS_HOST=localhost
    export REDIS_PORT=6380
    export REDIS_PASSWORD=sandbox_redis_password
    
    # Load sandbox environment
    if [[ -f "$SANDBOX_ENV_FILE" ]]; then
        set -a
        source "$SANDBOX_ENV_FILE"
        set +a
    fi
    
    # Run different test suites based on mode
    if [[ "$QUICK_MODE" == "true" ]]; then
        log_info "Running quick tests (no external API calls)..."
        run_quick_tests
    else
        log_info "Running full integration tests..."
        run_full_tests
    fi
}

# Run quick tests (no external API calls)
run_quick_tests() {
    cd "$PROJECT_ROOT/backend"
    
    # Run unit tests
    log_info "Running unit tests..."
    go test -v -short ./internal/... -coverprofile="$RESULTS_DIR/unit_coverage.out"
    
    # Run API tests (mock external services)
    log_info "Running API tests..."
    go test -v -tags=api ./tests/... -coverprofile="$RESULTS_DIR/api_coverage.out"
    
    log_success "Quick tests completed"
}

# Run full integration tests
run_full_tests() {
    cd "$PROJECT_ROOT/backend"
    
    # Run unit tests
    log_info "Running unit tests..."
    go test -v -short ./internal/... -coverprofile="$RESULTS_DIR/unit_coverage.out"
    
    # Run integration tests
    log_info "Running integration tests..."
    go test -v -tags=integration ./tests/... -coverprofile="$RESULTS_DIR/integration_coverage.out"
    
    # Run API tests
    log_info "Running API tests..."
    go test -v -tags=api ./tests/... -coverprofile="$RESULTS_DIR/api_coverage.out"
    
    # Run end-to-end tests if available
    if [[ -d "./tests/e2e" ]]; then
        log_info "Running end-to-end tests..."
        go test -v -tags=e2e ./tests/e2e/... -coverprofile="$RESULTS_DIR/e2e_coverage.out"
    fi
    
    log_success "Full integration tests completed"
}

# Generate test report
generate_report() {
    if [[ "$GENERATE_REPORT" != "true" ]]; then
        return
    fi
    
    log_info "Generating test report..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Combine coverage files
    if command -v gocovmerge &> /dev/null; then
        gocovmerge "$RESULTS_DIR"/*_coverage.out > "$RESULTS_DIR/combined_coverage.out"
        go tool cover -html="$RESULTS_DIR/combined_coverage.out" -o "$RESULTS_DIR/coverage_report.html"
    else
        log_warning "gocovmerge not found, generating individual coverage reports"
        for coverage_file in "$RESULTS_DIR"/*_coverage.out; do
            if [[ -f "$coverage_file" ]]; then
                filename=$(basename "$coverage_file" .out)
                go tool cover -html="$coverage_file" -o "$RESULTS_DIR/${filename}_report.html"
            fi
        done
    fi
    
    # Generate test summary
    cat > "$RESULTS_DIR/test_summary.txt" << EOF
NexusERP Integration Test Summary
================================
Generated: $(date)
Environment: sandbox
Mode: $([ "$QUICK_MODE" == "true" ] && echo "quick" || echo "full")

Test Results:
- Unit Tests: $(grep -c "PASS\|FAIL" "$RESULTS_DIR/unit_coverage.out" 2>/dev/null || echo "N/A")
- Integration Tests: $(grep -c "PASS\|FAIL" "$RESULTS_DIR/integration_coverage.out" 2>/dev/null || echo "N/A")
- API Tests: $(grep -c "PASS\|FAIL" "$RESULTS_DIR/api_coverage.out" 2>/dev/null || echo "N/A")

Coverage Reports:
- Unit Test Coverage: coverage_report.html
- Integration Coverage: integration_coverage_report.html
- API Coverage: api_coverage_report.html

EOF
    
    log_success "Test report generated in $RESULTS_DIR"
}

# Cleanup sandbox environment
cleanup_sandbox() {
    if [[ "$CLEANUP" != "true" ]]; then
        return
    fi
    
    log_info "Cleaning up sandbox environment..."
    
    cd "$PROJECT_ROOT"
    
    # Stop and remove containers
    $DOCKER_COMPOSE -f docker-compose.sandbox.yml down -v
    
    # Remove test data volumes
    docker volume rm nexus-erp-postgres-sandbox-data 2>/dev/null || true
    docker volume rm nexus-erp-redis-sandbox-data 2>/dev/null || true
    docker volume rm nexus-erp-test-results 2>/dev/null || true
    
    log_success "Sandbox environment cleaned up"
}

# Main execution
main() {
    log_info "Starting NexusERP Integration Tests"
    log_info "Project root: $PROJECT_ROOT"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup sandbox environment
    setup_sandbox
    
    # Run tests
    run_tests
    
    # Generate report
    generate_report
    
    # Cleanup if requested
    cleanup_sandbox
    
    log_success "Integration testing completed successfully!"
    
    if [[ "$GENERATE_REPORT" == "true" ]]; then
        log_info "Test results available in: $RESULTS_DIR"
    fi
}

# Trap to cleanup on script exit
trap cleanup_sandbox EXIT

# Run main function
main "$@"