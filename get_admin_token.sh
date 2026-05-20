#!/bin/sh
# This script seeds the admin supplier profile into the production Cloud SQL database
# via the Cloud SQL Auth Proxy

# Seed admin supplier profile using the API directly
ADMIN_TOKEN=$(curl -s -X POST \
  "https://revora-api-895912323169.us-central1.run.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@revora.com","password":"RevoraAdmin2026!"}' \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('accessToken',''))")

echo "Admin token: $ADMIN_TOKEN"
echo "Admin ID in DB: ddb22469-1af2-4df3-b953-708f98a81293"
