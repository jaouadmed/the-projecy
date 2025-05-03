#!/bin/bash

# DoliPaaS Minimal Testing Environment API Test Script
# This script tests the basic functionality of the DoliPaaS API endpoints

# Configuration
API_URL="http://localhost:3000/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
TEST_DEPLOYMENT_NAME="test-dolibarr"
OUTPUT_FILE="api-test-results.json"

echo "===== DoliPaaS API Testing Script ====="
echo "This script will test the basic functionality of the DoliPaaS API."
echo ""

# Function to display results
display_result() {
  local endpoint=$1
  local status=$2
  local response=$3
  
  echo "Endpoint: $endpoint"
  echo "Status: $status"
  echo "Response: $response"
  echo "-----------------------------------"
}

# Create output file
echo "{" > "$OUTPUT_FILE"
echo "  \"tests\": [" >> "$OUTPUT_FILE"

# Test 1: Register User
echo "[1/7] Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"'"$TEST_EMAIL"'","password":"'"$TEST_PASSWORD"'"}' \
  -w "\n%{http_code}")

REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$REGISTER_STATUS" == "201" ]; then
  echo "✅ User registration successful"
  REGISTER_RESULT="success"
else
  echo "❌ User registration failed"
  REGISTER_RESULT="failure"
fi

display_result "POST /users/register" "$REGISTER_STATUS" "$REGISTER_BODY"

echo "    {" >> "$OUTPUT_FILE"
echo "      \"name\": \"User Registration\"," >> "$OUTPUT_FILE"
echo "      \"endpoint\": \"POST /users/register\"," >> "$OUTPUT_FILE"
echo "      \"status\": $REGISTER_STATUS," >> "$OUTPUT_FILE"
echo "      \"result\": \"$REGISTER_RESULT\"" >> "$OUTPUT_FILE"
echo "    }," >> "$OUTPUT_FILE"

# Test 2: User Login
echo "\n[2/7] Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$TEST_EMAIL"'","password":"'"$TEST_PASSWORD"'"}' \
  -w "\n%{http_code}")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_STATUS" == "200" ]; then
  echo "✅ User login successful"
  LOGIN_RESULT="success"
  # Extract token for subsequent requests
  TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d\" -f4)
else
  echo "❌ User login failed"
  LOGIN_RESULT="failure"
  TOKEN=""
fi

display_result "POST /users/login" "$LOGIN_STATUS" "$LOGIN_BODY"

echo "    {" >> "$OUTPUT_FILE"
echo "      \"name\": \"User Login\"," >> "$OUTPUT_FILE"
echo "      \"endpoint\": \"POST /users/login\"," >> "$OUTPUT_FILE"
echo "      \"status\": $LOGIN_STATUS," >> "$OUTPUT_FILE"
echo "      \"result\": \"$LOGIN_RESULT\"" >> "$OUTPUT_FILE"
echo "    }," >> "$OUTPUT_FILE"

# Test 3: Create Dolibarr Deployment
if [ -n "$TOKEN" ]; then
  echo "\n[3/7] Testing deployment creation..."
  DEPLOY_RESPONSE=$(curl -s -X POST "$API_URL/deployments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"'"$TEST_DEPLOYMENT_NAME"'","type":"dolibarr","config":{"version":"latest"}}' \
    -w "\n%{http_code}")
  
  DEPLOY_STATUS=$(echo "$DEPLOY_RESPONSE" | tail -n1)
  DEPLOY_BODY=$(echo "$DEPLOY_RESPONSE" | sed '$d')
  
  if [ "$DEPLOY_STATUS" == "201" ]; then
    echo "✅ Deployment creation successful"
    DEPLOY_RESULT="success"
    # Extract deployment ID for subsequent requests
    DEPLOYMENT_ID=$(echo "$DEPLOY_BODY" | grep -o '"_id":"[^"]*"' | cut -d\" -f4)
  else
    echo "❌ Deployment creation failed"
    DEPLOY_RESULT="failure"
    DEPLOYMENT_ID=""
  fi
  
  display_result "POST /deployments" "$DEPLOY_STATUS" "$DEPLOY_BODY"
  
  echo "    {" >> "$OUTPUT_FILE"
  echo "      \"name\": \"Create Deployment\"," >> "$OUTPUT_FILE"
  echo "      \"endpoint\": \"POST /deployments\"," >> "$OUTPUT_FILE"
  echo "      \"status\": $DEPLOY_STATUS," >> "$OUTPUT_FILE"
  echo "      \"result\": \"$DEPLOY_RESULT\"" >> "$OUTPUT_FILE"
  echo "    }," >> "$OUTPUT_FILE"
  
  # Test 4: Get Deployment Status
  if [ -n "$DEPLOYMENT_ID" ]; then
    echo "\n[4/7] Testing deployment status..."
    STATUS_RESPONSE=$(curl -s -X GET "$API_URL/deployments/$DEPLOYMENT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -w "\n%{http_code}")
    
    STATUS_STATUS=$(echo "$STATUS_RESPONSE" | tail -n1)
    STATUS_BODY=$(echo "$STATUS_RESPONSE" | sed '$d')
    
    if [ "$STATUS_STATUS" == "200" ]; then
      echo "✅ Deployment status check successful"
      STATUS_RESULT="success"
    else
      echo "❌ Deployment status check failed"
      STATUS_RESULT="failure"
    fi
    
    display_result "GET /deployments/$DEPLOYMENT_ID" "$STATUS_STATUS" "$STATUS_BODY"
    
    echo "    {" >> "$OUTPUT_FILE"
    echo "      \"name\": \"Get Deployment Status\"," >> "$OUTPUT_FILE"
    echo "      \"endpoint\": \"GET /deployments/$DEPLOYMENT_ID\"," >> "$OUTPUT_FILE"
    echo "      \"status\": $STATUS_STATUS," >> "$OUTPUT_FILE"
    echo "      \"result\": \"$STATUS_RESULT\"" >> "$OUTPUT_FILE"
    echo "    }," >> "$OUTPUT_FILE"
    
    # Test 5: Update Deployment
    echo "\n[5/7] Testing deployment update..."
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/deployments/$DEPLOYMENT_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"config":{"version":"latest","modules":["modSociete","modProduct"]}}' \
      -w "\n%{http_code}")
    
    UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | tail -n1)
    UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')
    
    if [ "$UPDATE_STATUS" == "200" ]; then
      echo "✅ Deployment update successful"
      UPDATE_RESULT="success"
    else
      echo "❌ Deployment update failed"
      UPDATE_RESULT="failure"
    fi
    
    display_result "PUT /deployments/$DEPLOYMENT_ID" "$UPDATE_STATUS" "$UPDATE_BODY"
    
    echo "    {" >> "$OUTPUT_FILE"
    echo "      \"name\": \"Update Deployment\"," >> "$OUTPUT_FILE"
    echo "      \"endpoint\": \"PUT /deployments/$DEPLOYMENT_ID\"," >> "$OUTPUT_FILE"
    echo "      \"status\": $UPDATE_STATUS," >> "$OUTPUT_FILE"
    echo "      \"result\": \"$UPDATE_RESULT\"" >> "$OUTPUT_FILE"
    echo "    }," >> "$OUTPUT_FILE"
    
    # Test 6: Control Deployment (restart)
    echo "\n[6/7] Testing deployment control (restart)..."
    CONTROL_RESPONSE=$(curl -s -X POST "$API_URL/deployments/$DEPLOYMENT_ID/control" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"action":"restart"}' \
      -w "\n%{http_code}")
    
    CONTROL_STATUS=$(echo "$CONTROL_RESPONSE" | tail -n1)
    CONTROL_BODY=$(echo "$CONTROL_RESPONSE" | sed '$d')
    
    if [ "$CONTROL_STATUS" == "200" ]; then
      echo "✅ Deployment control successful"
      CONTROL_RESULT="success"
    else
      echo "❌ Deployment control failed"
      CONTROL_RESULT="failure"
    fi
    
    display_result "POST /deployments/$DEPLOYMENT_ID/control" "$CONTROL_STATUS" "$CONTROL_BODY"
    
    echo "    {" >> "$OUTPUT_FILE"
    echo "      \"name\": \"Control Deployment\"," >> "$OUTPUT_FILE"
    echo "      \"endpoint\": \"POST /deployments/$DEPLOYMENT_ID/control\"," >> "$OUTPUT_FILE"
    echo "      \"status\": $CONTROL_STATUS," >> "$OUTPUT_FILE"
    echo "      \"result\": \"$CONTROL_RESULT\"" >> "$OUTPUT_FILE"
    echo "    }," >> "$OUTPUT_FILE"
    
    # Test 7: Delete Deployment
    echo "\n[7/7] Testing deployment deletion..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/deployments/$DEPLOYMENT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -w "\n%{http_code}")
    
    DELETE_STATUS=$(echo "$DELETE_RESPONSE" | tail -n1)
    DELETE_BODY=$(echo "$DELETE_RESPONSE" | sed '$d')
    
    if [ "$DELETE_STATUS" == "200" ]; then
      echo "✅ Deployment deletion successful"
      DELETE_RESULT="success"
    else
      echo "❌ Deployment deletion failed"
      DELETE_RESULT="failure"
    fi
    
    display_result "DELETE /deployments/$DEPLOYMENT_ID" "$DELETE_STATUS" "$DELETE_BODY"
    
    echo "    {" >> "$OUTPUT_FILE"
    echo "      \"name\": \"Delete Deployment\"," >> "$OUTPUT_FILE"
    echo "      \"endpoint\": \"DELETE /deployments/$DEPLOYMENT_ID\"," >> "$OUTPUT_FILE"
    echo "      \"status\": $DELETE_STATUS," >> "$OUTPUT_FILE"
    echo "      \"result\": \"$DELETE_RESULT\"" >> "$OUTPUT_FILE"
    echo "    }" >> "$OUTPUT_FILE"
  else
    echo "⚠️ Skipping deployment tests as deployment creation failed"
  fi
else
  echo "⚠️ Skipping deployment tests as login failed"
fi

# Finalize output file
echo "  ]" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

echo "\n===== API Testing Complete ====="
echo "Results saved to $OUTPUT_FILE"

# Summary
echo "\nTest Summary:"
SUCCESS_COUNT=$(grep -c '"result":"success"' "$OUTPUT_FILE")
TOTAL_COUNT=$(grep -c '"name":' "$OUTPUT_FILE")
echo "✅ Successful tests: $SUCCESS_COUNT/$TOTAL_COUNT"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_COUNT" ]; then
  echo "🎉 All tests passed!"
else
  echo "⚠️ Some tests failed. Check $OUTPUT_FILE for details."
fi