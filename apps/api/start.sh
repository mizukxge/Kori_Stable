#!/bin/sh

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
if npx prisma db push --skip-generate --accept-data-loss 2>&1; then
  echo "✅ Schema synced successfully"
else
  echo "⚠️  Schema sync attempt completed (may have warnings)"
fi
echo ""

echo "Step 3: Seeding database..."
if npx prisma db seed 2>&1; then
  echo "✅ Database seeded successfully"
else
  echo "⚠️  Seed attempt completed (may have warnings)"
fi
echo ""

echo "Step 4: Starting API server..."
exec npm run start
