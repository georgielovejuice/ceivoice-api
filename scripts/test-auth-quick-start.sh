#!/bin/bash

# Quick Start - Auth Testing
# Run this script to get started with authentication testing

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     CeiVoice API - Authentication Testing Guide             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

echo "Step 1: Start the Backend Server"
echo "────────────────────────────────────────────────────────────"
echo "Run in a separate terminal:"
echo ""
echo "  cd backend"
echo "  pnpm install"
echo "  cp .env.example .env"
echo "  pnpm run dev"
echo ""
echo "Wait for: 'Server listening on port 5000'"
echo ""
read -p "Press Enter once server is running..."
echo

echo "Step 2: Test Registration"
echo "────────────────────────────────────────────────────────────"
echo "Run this command to register a new user:"
echo ""
echo 'curl -X POST http://localhost:5000/api/auth/register \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
echo '    "fullName": "Test User",
echo '    "email": "test.user@example.com",
echo '    "password": "Password123!",
echo '    "confirmPassword": "Password123!"
echo '  }'"'"
echo ""
read -p "Copy the returned accessToken and press Enter..."
echo

echo "Step 3: Test Protected Route Access"
echo "────────────────────────────────────────────────────────────"
echo "Replace YOUR_TOKEN with the token from Step 2:"
echo ""
echo 'curl -X GET http://localhost:5000/api/auth/me \'
echo '  -H "Authorization: Bearer YOUR_TOKEN"'
echo ""
read -p "Press Enter after testing..."
echo

echo "Step 4: Test Token Refresh"
echo "────────────────────────────────────────────────────────────"
echo "Use the refreshToken from registration response:"
echo ""
echo 'curl -X POST http://localhost:5000/api/auth/refresh \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
echo '    "refreshToken": "YOUR_REFRESH_TOKEN"
echo '  }'"'"
echo ""
read -p "Press Enter after testing..."
echo

echo "Step 5: View All Test Instructions"
echo "────────────────────────────────────────────────────────────"
echo "Open the detailed guide:"
echo ""
echo "  cat docs/testing/AUTH_TESTING_GUIDE.md"
echo ""
echo "This file contains:"
echo "  - All test commands with explanations"
echo "  - Expected responses"
echo "  - Error scenarios"
echo "  - JWT claim verification"
echo "  - Google OAuth testing"
echo ""

echo "Testing Setup Complete"
echo ""
echo "Next: Follow the commands above to test each flow"
echo "Detailed instructions: docs/testing/AUTH_TESTING_GUIDE.md"
