#!/bin/bash

# Railway CLI Deployment Script for Kori
# This script creates services directly via CLI instead of web UI

echo "========================================="
echo "Railway Service Deployment via CLI"
echo "========================================="
echo ""

# Get current project context
echo "Current Railway context:"
railway context
echo ""

# Create API service
echo "Creating API service (kori-api)..."
railway service new --name kori-api --dockerfile Dockerfile.api

echo ""
echo "Creating Web service (kori-web)..."
railway service new --name kori-web --dockerfile Dockerfile.web

echo ""
echo "Services created! Triggering deployment..."
echo ""

# Deploy API
echo "Deploying API service..."
railway service set kori-api
railway up

echo ""
echo "Deploying Web service..."
railway service set kori-web
railway up

echo ""
echo "========================================="
echo "Deployment initiated!"
echo "========================================="
echo ""
echo "Check deployment status at: https://railway.app"
echo "View logs with: railway logs"
echo ""
