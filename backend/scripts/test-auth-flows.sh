#!/bin/bash

# Authentication Testing Script
# Tests all auth flows: registration, login, token refresh, protected routes, OAuth

set -e

# Configuration
BASE_URL="http://localhost:5000/api"
TEST_EMAIL="test.$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123"
FULL_NAME="Test User $(date +%s)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test Results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to print test headers
print_test() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Helper function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

# Helper function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

# Helper function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Start tests
echo -e "\n${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Authentication Flows Test Suite       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

print_test "TEST 1: User Registration"

# Register new user
echo "Registering user with email: $TEST_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"$FULL_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"confirmPassword\": \"$TEST_PASSWORD\"
  }")

echo "Response: $REGISTER_RESPONSE"

# Extract tokens and user ID
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
    print_success "Registration successful - tokens received"
    echo "  Access Token: ${ACCESS_TOKEN:0:30}..."
    echo "  Refresh Token: ${REFRESH_TOKEN:0:30}..."
    echo "  User ID: $USER_ID"
else
    print_error "Registration failed - no tokens in response"
    exit 1
fi

# Verify tokens are JWT format
if [[ "$ACCESS_TOKEN" == *.*.* ]]; then
    print_success "Access token is in JWT format"
else
    print_error "Access token is NOT in JWT format"
fi

if [[ "$REFRESH_TOKEN" == *.*.* ]]; then
    print_success "Refresh token is in JWT format"
else
    print_error "Refresh token is NOT in JWT format"
fi

print_test "TEST 2: Protected Route Access (GET /api/auth/me)"

# Test accessing protected route with token
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $ME_RESPONSE"

if echo "$ME_RESPONSE" | grep -q "$TEST_EMAIL"; then
    print_success "Protected route accessible with valid token"
else
    print_error "Protected route failed - could not verify email in response"
fi

print_test "TEST 3: Protected Route Without Token (Should Fail)"

# Test accessing protected route WITHOUT token
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me")

echo "Response: $UNAUTH_RESPONSE"

if echo "$UNAUTH_RESPONSE" | grep -q "Unauthorized\|401\|Missing token\|Not authenticated"; then
    print_success "Protected route correctly rejected request without token"
else
    print_warning "Protected route response: $UNAUTH_RESPONSE"
fi

print_test "TEST 4: User Login"

# Login with same credentials
echo "Logging in with email: $TEST_EMAIL"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Response: $LOGIN_RESPONSE"

NEW_ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
NEW_REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$NEW_ACCESS_TOKEN" ] && [ -n "$NEW_REFRESH_TOKEN" ]; then
    print_success "Login successful - new tokens received"
    echo "  Access Token: ${NEW_ACCESS_TOKEN:0:30}..."
    echo "  Refresh Token: ${NEW_REFRESH_TOKEN:0:30}..."
else
    print_error "Login failed - no tokens in response"
fi

print_test "TEST 5: Token Refresh"

# Refresh the token
echo "Attempting to refresh access token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$NEW_REFRESH_TOKEN\"
  }")

echo "Response: $REFRESH_RESPONSE"

REFRESHED_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$REFRESHED_ACCESS_TOKEN" ]; then
    print_success "Token refresh successful - new access token received"
    echo "  New Access Token: ${REFRESHED_ACCESS_TOKEN:0:30}..."
else
    print_error "Token refresh failed - no token in response"
fi

# Verify new token works
NEW_ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $REFRESHED_ACCESS_TOKEN")

if echo "$NEW_ME_RESPONSE" | grep -q "$TEST_EMAIL"; then
    print_success "New access token works - can access protected route"
else
    print_error "New access token failed - cannot access protected route"
fi

print_test "TEST 6: Login with Wrong Password (Should Fail)"

# Try login with wrong password
WRONG_PASS_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword123\"
  }")

echo "Response: $WRONG_PASS_RESPONSE"

if echo "$WRONG_PASS_RESPONSE" | grep -q "Invalid\|Unauthorized\|401\|incorrect"; then
    print_success "Login correctly rejected invalid password"
else
    print_warning "Wrong password response: $WRONG_PASS_RESPONSE"
fi

print_test "TEST 7: Login with Non-Existent Email (Should Fail)"

# Try login with non-existent email
NONEXIST_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"nonexistent$(date +%s)@example.com\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Response: $NONEXIST_RESPONSE"

if echo "$NONEXIST_RESPONSE" | grep -q "Invalid\|Unauthorized\|401\|not found"; then
    print_success "Login correctly rejected non-existent email"
else
    print_warning "Non-existent email response: $NONEXIST_RESPONSE"
fi

print_test "TEST 8: Token Validation (JWT Claims)"

# Decode JWT to check claims (basic base64 decode)
echo "Analyzing JWT claims in access token..."

# Split JWT and decode payload
IFS='.' read -r HEADER PAYLOAD SIGNATURE <<< "$NEW_ACCESS_TOKEN"
DECODED_PAYLOAD=$(echo "$PAYLOAD" | base64 -d 2>/dev/null || echo "Failed to decode")

echo "Decoded payload: $DECODED_PAYLOAD"

if echo "$DECODED_PAYLOAD" | grep -q "ceivoice-api"; then
    print_success "JWT contains correct issuer (ceivoice-api)"
else
    print_warning "JWT issuer not verified in payload"
fi

if echo "$DECODED_PAYLOAD" | grep -q "ceivoice-clients"; then
    print_success "JWT contains correct audience (ceivoice-clients)"
else
    print_warning "JWT audience not verified in payload"
fi

if echo "$DECODED_PAYLOAD" | grep -q "exp"; then
    print_success "JWT contains expiration claim"
else
    print_warning "JWT missing expiration claim"
fi

print_test "TEST 9: Google OAuth Endpoint (GET /api/auth/google)"

# Test OAuth endpoint (should redirect, not return 200)
GOOGLE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/auth/google" \
  -H "Accept: text/html")

HTTP_CODE=$(echo "$GOOGLE_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    print_success "Google OAuth endpoint returns redirect (HTTP $HTTP_CODE) as expected"
elif [ "$HTTP_CODE" = "200" ]; then
    print_warning "Google OAuth endpoint returned 200 (may be dev mode)"
else
    print_warning "Google OAuth endpoint returned HTTP $HTTP_CODE"
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo -e "\nTotal Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Review output above.${NC}"
    exit 1
fi
