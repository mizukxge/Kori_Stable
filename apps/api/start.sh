#!/bin/sh
set -e

echo "=========================================="
echo "Starting Kori API Server"
echo "=========================================="
echo ""

echo "Step 1: Checking environment..."
echo "  DATABASE_URL present: ${DATABASE_URL:+yes}"
echo "  NODE_ENV: ${NODE_ENV}"
echo "  Working directory: $(pwd)"
echo ""

echo "Step 2: Syncing Prisma schema to database..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 | head -20
echo "✅ Schema synced"
echo ""

echo "Step 3: Seeding database..."
npx prisma db seed 2>&1 | tail -10
echo "✅ Database seeded"
echo ""

echo "Step 4: Starting API server..."
npm run start
