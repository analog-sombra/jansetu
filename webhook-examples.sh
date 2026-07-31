#!/bin/bash

# Complaint Webhook cURL Examples
# Usage: bash webhook-examples.sh

API_URL="${API_URL:-http://localhost:3000}"
WEBHOOK_ENDPOINT="${API_URL}/api/webhook/complaint"

echo "==== Complaint Webhook cURL Examples ===="
echo "API URL: $WEBHOOK_ENDPOINT"
echo ""

# Example 1: Health Check
echo "--- Example 1: Health Check ---"
echo "curl -X GET ${WEBHOOK_ENDPOINT}"
echo ""

# Example 2: Single Complaint
echo "--- Example 2: Single Complaint ---"
cat <<'EOF'
curl -X POST http://localhost:3000/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "id": "145a3716-0cac-4e94-b1e4-40afd7e82f75",
        "ticket_number": "INC-00005",
        "customer_name": "Mudassir",
        "customer_phone": "7666664545",
        "category": "service_issue",
        "subject": "No Electricity in Area",
        "description": "Contact Number||7666664545||Service Issue - Electricity||No electricity supply since 5 days||402/Karam Niwas, Near Garden, Punjabi Bagh||Gully 43||Punjabi Bagh||Rajouri Garden Constituency",
        "status": "open",
        "priority": "high",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-28T09:33:11.446Z",
        "updated_at": "2026-07-28T09:33:11.446Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }'
EOF
echo ""

# Example 3: Multiple Complaints
echo "--- Example 3: Multiple Complaints ---"
cat <<'EOF'
curl -X POST http://localhost:3000/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "id": "145a3716-0cac-4e94-b1e4-40afd7e82f75",
        "ticket_number": "INC-00005",
        "customer_name": "Mudassir",
        "customer_phone": "7666664545",
        "category": "service_issue",
        "subject": "No Electricity in Area",
        "description": "Contact Number||7666664545||Service Issue - Electricity||No electricity supply since 5 days||402/Karam Niwas, Near Garden, Punjabi Bagh||Gully 43||Punjabi Bagh||Rajouri Garden Constituency",
        "status": "open",
        "priority": "high",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-28T09:33:11.446Z",
        "updated_at": "2026-07-28T09:33:11.446Z"
      },
      {
        "id": "ced50415-510d-46e0-af99-7fdf82957237",
        "ticket_number": "INC-00004",
        "customer_name": "Mudassir",
        "customer_phone": "9988776606",
        "category": "service_issue",
        "subject": "No electricity in area",
        "description": "Electricity||No electricity in the area since 2 days||Mudassir||9988776606||394/Bhoomi Villas, Near Government School, Rajouri Garden||Ward Number Not Known||Rajouri Garden||Gully No. 2||Not Provided",
        "status": "open",
        "priority": "high",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-27T12:50:17.652Z",
        "updated_at": "2026-07-28T09:23:46.484Z"
      }
    ],
    "total": 2,
    "limit": 50,
    "offset": 0
  }'
EOF
echo ""

# Example 4: With Different Priority Levels
echo "--- Example 4: Different Priority Levels ---"
cat <<'EOF'
curl -X POST http://localhost:3000/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "id": "urgent-001",
        "ticket_number": "INC-00101",
        "customer_name": "Saad Chouhan",
        "customer_phone": "919773356997",
        "category": "Electricity",
        "subject": "No electricity supply for 3 days",
        "description": "No electricity supply for 3 days||Household has small children and aged people||Urgent resolution needed||123 Main Street",
        "status": "open",
        "priority": "urgent",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-26T11:47:12.900Z",
        "updated_at": "2026-07-26T11:47:12.900Z"
      },
      {
        "id": "high-001",
        "ticket_number": "INC-00102",
        "customer_name": "John Doe",
        "customer_phone": "9876543210",
        "category": "water_supply",
        "subject": "No water supply",
        "description": "No water in area for 1 day||Affects 50 households||Need immediate action",
        "status": "open",
        "priority": "high",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-28T10:00:00.000Z",
        "updated_at": "2026-07-28T10:00:00.000Z"
      },
      {
        "id": "medium-001",
        "ticket_number": "INC-00103",
        "customer_name": "Jane Smith",
        "customer_phone": "8765432109",
        "category": "road_repair",
        "subject": "Pothole in road",
        "description": "Large pothole||Main Street||Needs repair||Can schedule next week",
        "status": "open",
        "priority": "medium",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-28T11:00:00.000Z",
        "updated_at": "2026-07-28T11:00:00.000Z"
      },
      {
        "id": "low-001",
        "ticket_number": "INC-00104",
        "customer_name": "Bob Johnson",
        "customer_phone": "7654321098",
        "category": "street_light",
        "subject": "Street light not working",
        "description": "One street light is broken||Non-residential area||Can be fixed during next maintenance cycle",
        "status": "open",
        "priority": "low",
        "preferred_resolution": null,
        "order_reference": null,
        "created_at": "2026-07-28T12:00:00.000Z",
        "updated_at": "2026-07-28T12:00:00.000Z"
      }
    ],
    "total": 4,
    "limit": 50,
    "offset": 0
  }'
EOF
echo ""

# Example 5: Using External File
echo "--- Example 5: From External JSON File ---"
echo "curl -X POST http://localhost:3000/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json"
echo ""

# Example 6: With Response Pretty Printing
echo "--- Example 6: Pretty Print Response ---"
echo "curl -s -X POST http://localhost:3000/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json | jq ."
echo ""

# Example 7: Save Response to File
echo "--- Example 7: Save Response to File ---"
echo "curl -X POST http://localhost:3000/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json > response.json"
echo ""

# Example 8: With Custom Headers
echo "--- Example 8: With Headers ---"
echo "curl -X POST http://localhost:3000/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  -H \"X-Request-ID: $(uuidgen)\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json"
echo ""

# Example 9: With Verbose Output
echo "--- Example 9: Verbose Output ---"
echo "curl -v -X POST http://localhost:3000/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json"
echo ""

# Example 10: Test Different Domains
echo "--- Example 10: Test Different Environments ---"
echo "# Local Development:"
echo "curl -X POST http://localhost:3000/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json"
echo ""
echo "# Staging:"
echo "curl -X POST https://staging.example.com/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json"
echo ""
echo "# Production:"
echo "curl -X POST https://api.example.com/api/webhook/complaint \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer PROD_TOKEN\" \\"
echo "  -d @__tests__/webhook-complaint-sample.json"
echo ""

echo "==== Quick Test Commands ===="
echo ""
echo "1. Run health check:"
echo "   curl http://localhost:3000/api/webhook/complaint"
echo ""
echo "2. Run test script:"
echo "   node __tests__/webhook-complaint-test.js"
echo ""
echo "3. Send sample data:"
echo "   curl -X POST http://localhost:3000/api/webhook/complaint \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d @__tests__/webhook-complaint-sample.json | jq ."
echo ""
