#!/bin/bash

echo "=== Manual Authentication Middleware Test ==="

# Test 1: Try to access protected route without token
echo ""
echo "1. Testing protected route without authentication..."
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8080/api/users/me

echo ""
echo "2. Testing protected route with invalid token..."
curl -s -w "\nHTTP Status: %{http_code}\n" -H "Authorization: Bearer invalid.token.here" http://localhost:8080/api/users/me

echo ""
echo "3. Testing health endpoint (public)..."
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8080/health

echo ""
echo "=== Test Complete ==="