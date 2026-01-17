#!/bin/bash
# Quick deployment script for Fly.io

set -e

echo "🚀 Deploying Resume Builder to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Install from https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io..."
    flyctl auth login
fi

# Build and deploy
echo "📦 Building and deploying..."
flyctl deploy --remote-only

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://$(flyctl status --json | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4)"

