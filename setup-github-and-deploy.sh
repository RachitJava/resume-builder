#!/bin/bash
# Script to push to GitHub and deploy to Fly.io

set -e

echo "🚀 Setting up GitHub and Fly.io deployment..."

cd /Users/rachit/resume-builder

# Step 1: Initialize Git (if not already)
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# Step 2: Add all files
echo "📝 Adding files to Git..."
git add .

# Step 3: Commit (if there are changes)
if ! git diff --staged --quiet; then
    echo "💾 Committing changes..."
    git commit -m "Initial commit: Resume Builder app with Fly.io deployment setup" || \
    git commit -m "Update: Resume Builder app with Fly.io deployment setup"
else
    echo "✅ No changes to commit"
fi

# Step 4: Check for remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo ""
    echo "⚠️  No GitHub remote found!"
    echo ""
    echo "Please create a GitHub repository first:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository (e.g., 'resume-builder')"
    echo "3. Then run:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/resume-builder.git"
    echo "   git push -u origin main"
    echo ""
    read -p "Have you created the GitHub repo? Enter repo URL (or press Enter to skip): " REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ Remote added!"
    else
        echo "⏭️  Skipping GitHub push. You can add it later with:"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/resume-builder.git"
        echo "   git push -u origin main"
    fi
fi

# Step 5: Push to GitHub (if remote exists)
if git remote get-url origin &>/dev/null; then
    echo ""
    echo "📤 Pushing to GitHub..."
    git push -u origin main || {
        echo "⚠️  Push failed. You may need to set up authentication."
        echo "   Run: gh auth login (if using GitHub CLI)"
        echo "   Or: git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/resume-builder.git"
    }
fi

# Step 6: Deploy to Fly.io
echo ""
echo "🌐 Deploying to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed!"
    echo ""
    echo "Install it with:"
    echo "   curl -L https://fly.io/install.sh | sh"
    echo ""
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io..."
    flyctl auth login
fi

# Check if app already exists
APP_NAME="resume-builder-app"
if ! flyctl status --app "$APP_NAME" &>/dev/null; then
    echo "🆕 Creating new Fly.io app..."
    flyctl launch --name "$APP_NAME" --region iad --no-config --copy-config || true
    
    # Set secrets
    echo ""
    echo "🔑 Setting up environment variables..."
    echo "Please enter your secrets when prompted:"
    
    read -p "Gmail App Password (MAIL_PASSWORD): " MAIL_PASS
    if [ ! -z "$MAIL_PASS" ]; then
        flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com --app "$APP_NAME"
        flyctl secrets set MAIL_PASSWORD="$MAIL_PASS" --app "$APP_NAME"
    fi
    
    read -p "Groq API Key (AI_API_KEY): " AI_KEY
    if [ ! -z "$AI_KEY" ]; then
        flyctl secrets set AI_API_KEY="$AI_KEY" --app "$APP_NAME"
    else
        # Use default if not provided
        flyctl secrets set AI_API_KEY="${AI_API_KEY:-YOUR_GROQ_API_KEY}" --app "$APP_NAME"
    fi
    
    flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions --app "$APP_NAME"
    flyctl secrets set AI_MODEL=llama-3.3-70b-versatile --app "$APP_NAME"
    
    # Get app URL and set CORS
    APP_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "")
    if [ ! -z "$APP_URL" ]; then
        flyctl secrets set CORS_ORIGINS="https://$APP_URL" --app "$APP_NAME"
    fi
else
    echo "✅ App '$APP_NAME' already exists"
fi

# Deploy
echo ""
echo "🚀 Deploying application..."
flyctl deploy --app "$APP_NAME" --remote-only

# Get app URL
APP_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "")

echo ""
echo "✅ Deployment complete!"
if [ ! -z "$APP_URL" ]; then
    echo "🌐 Your app is live at: https://$APP_URL"
    echo ""
    echo "📝 Update CORS_ORIGINS if needed:"
    echo "   flyctl secrets set CORS_ORIGINS=\"https://$APP_URL\" --app $APP_NAME"
fi

echo ""
echo "📊 Useful commands:"
echo "   flyctl logs --app $APP_NAME        # View logs"
echo "   flyctl status --app $APP_NAME      # Check status"
echo "   flyctl open --app $APP_NAME        # Open in browser"

