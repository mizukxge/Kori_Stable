# Railway Deployment Setup Script for Kori Photography Platform
# This script automates the configuration for Railway deployment

Write-Host "🚂 Railway Deployment Setup for Kori" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Railway CLI is installed
Write-Host "Step 1: Checking Railway CLI..." -ForegroundColor Yellow
try {
    $version = railway --version
    Write-Host "✅ Railway CLI found: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Login to Railway
Write-Host "Step 2: Authenticating with Railway..." -ForegroundColor Yellow
Write-Host "Follow the prompts to log in. A browser will open." -ForegroundColor Gray
railway login

Write-Host ""
Write-Host "✅ Authenticated with Railway" -ForegroundColor Green
Write-Host ""

# Step 3: Link to project
Write-Host "Step 3: Linking to Railway project..." -ForegroundColor Yellow
Write-Host "Select your project and environment when prompted" -ForegroundColor Gray
railway link

Write-Host ""
Write-Host "✅ Linked to Railway project" -ForegroundColor Green
Write-Host ""

# Step 4: Gather configuration
Write-Host "Step 4: Gathering Configuration" -ForegroundColor Yellow
Write-Host ""

$stripeSecret = Read-Host "🔑 Enter STRIPE_SECRET_KEY (from https://dashboard.stripe.com/apikeys)"
$stripePublishable = Read-Host "🔑 Enter STRIPE_PUBLISHABLE_KEY"
$stripeWebhook = Read-Host "🔑 Enter STRIPE_WEBHOOK_SECRET"

# Generate SESSION_SECRET
$sessionSecret = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([Guid]::NewGuid().ToString()))

Write-Host ""
Write-Host "✅ Configuration gathered" -ForegroundColor Green
Write-Host ""

# Step 5: Set environment variables in Railway
Write-Host "Step 5: Setting environment variables in Railway..." -ForegroundColor Yellow

$envVars = @{
    "NODE_ENV" = "production"
    "SESSION_SECRET" = $sessionSecret
    "STRIPE_SECRET_KEY" = $stripeSecret
    "STRIPE_PUBLISHABLE_KEY" = $stripePublishable
    "STRIPE_WEBHOOK_SECRET" = $stripeWebhook
    "LOG_LEVEL" = "info"
}

foreach ($key in $envVars.Keys) {
    Write-Host "  Setting $key..." -ForegroundColor Gray
    railway variables set $key $envVars[$key]
}

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Step 6: Display next steps
Write-Host "Step 6: Configure Services in Railway Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to create 2 services in https://railway.app:" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Service 1: kori-api" -ForegroundColor Green
Write-Host "  - Service: GitHub Repo (Kori_Stable)" -ForegroundColor Gray
Write-Host "  - Root Directory: apps/api" -ForegroundColor Gray
Write-Host "  - Dockerfile Path: Dockerfile.api" -ForegroundColor Gray
Write-Host "  - Port: 3001" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Service 2: kori-web" -ForegroundColor Green
Write-Host "  - Service: GitHub Repo (Kori_Stable)" -ForegroundColor Gray
Write-Host "  - Root Directory: apps/web" -ForegroundColor Gray
Write-Host "  - Dockerfile Path: Dockerfile.web" -ForegroundColor Gray
Write-Host "  - Port: 3000" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Quick Instructions:" -ForegroundColor Yellow
Write-Host "  1. Open https://railway.app" -ForegroundColor Gray
Write-Host "  2. Select your project/environment" -ForegroundColor Gray
Write-Host "  3. Click '+ New' and select 'GitHub Repo'" -ForegroundColor Gray
Write-Host "  4. Create kori-api service with Dockerfile.api" -ForegroundColor Gray
Write-Host "  5. Create kori-web service with Dockerfile.web" -ForegroundColor Gray
Write-Host "  6. Services will auto-deploy after linking" -ForegroundColor Gray
Write-Host ""

Write-Host "⏳ After Services Deploy:" -ForegroundColor Yellow
Write-Host "  1. Update CORS_ORIGIN in railway variables" -ForegroundColor Gray
Write-Host "  2. Update VITE_API_URL in web service variables" -ForegroundColor Gray
Write-Host "  3. Configure Stripe webhooks to:" -ForegroundColor Gray
Write-Host "     https://<your-api-domain>/webhooks/stripe" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "🚀 You're ready to deploy. Visit your Railway dashboard to continue." -ForegroundColor Cyan
