#!/bin/bash
# Complete deployment script: Push to GitHub and Deploy to Fly.io

set -e

echo "🚀 Resume Builder - Complete Deployment"
echo "========================================"
echo ""

cd /Users/rachit/resume-builder

# GitHub Token - SET YOUR TOKEN HERE or use environment variable
GITHUB_TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN_HERE}"
GITHUB_REPO="https://github.com/RachitJava/resume-builder.git"
GITHUB_URL_WITH_TOKEN="https://${GITHUB_TOKEN}@github.com/RachitJava/resume-builder.git"

# Step 1: Git Setup and Push
echo "📦 Step 1: Pushing to GitHub..."

if [ ! -d .git ]; then
    git init
    echo "✅ Git initialized"
fi

git branch -M main

# Add files
git add .

# Commit
if ! git diff --cached --quiet || ! git diff --quiet; then
    git commit -m "Initial commit: Resume Builder app with Fly.io deployment setup" 2>&1 || \
    git commit -m "Update: Resume Builder app" 2>&1
    echo "✅ Files committed"
else
    echo "✅ No new changes to commit"
fi

# Set remote with token
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL_WITH_TOKEN" 2>/dev/null || \
git remote set-url origin "$GITHUB_URL_WITH_TOKEN"

echo "✅ Remote configured"

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: https://github.com/RachitJava/resume-builder"
else
    echo "❌ Git push failed. Please check your token and try again."
    exit 1
fi

# Step 2: Fly.io Setup
echo ""
echo "🌐 Step 2: Setting up Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "📥 Installing Fly.io CLI..."
    curl -L https://fly.io/install.sh | sh
    
    # Add to PATH
    export PATH="$HOME/.fly/bin:$PATH"
    
    # Reload shell config
    if [ -f ~/.zshrc ]; then
        source ~/.zshrc 2>/dev/null || true
    fi
    
    if ! command -v flyctl &> /dev/null; then
        echo "⚠️  Please restart your terminal or run: export PATH=\"\$HOME/.fly/bin:\$PATH\""
        echo "Then run this script again."
        exit 1
    fi
    echo "✅ flyctl installed"
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io (will open browser)..."
    flyctl auth login
fi

echo "✅ Logged in to Fly.io as: $(flyctl auth whoami 2>/dev/null || echo 'user')"

# Step 3: Create or use Fly.io app
APP_NAME="resume-builder-app"
echo ""
echo "🆕 Step 3: Setting up Fly.io app: $APP_NAME"

if ! flyctl status --app "$APP_NAME" &>/dev/null 2>&1; then
    echo "Creating new Fly.io app..."
    
    # Create app
    flyctl apps create "$APP_NAME" --org personal 2>&1 || true
    
    # Set region if app was created
    echo "✅ App created: $APP_NAME"
else
    echo "✅ App already exists: $APP_NAME"
fi

# Step 4: Set Secrets
echo ""
echo "🔑 Step 4: Setting environment variables..."

# Email secrets
read -sp "Enter Gmail App Password (or press Enter to use existing): " MAIL_PASS
echo ""
if [ ! -z "$MAIL_PASS" ]; then
    flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com --app "$APP_NAME"
    flyctl secrets set MAIL_PASSWORD="$MAIL_PASS" --app "$APP_NAME"
    echo "✅ Email secrets set"
else
    echo "⏭️  Skipping email secrets (using existing)"
fi

# AI secrets (set via environment variable or prompt)
echo "Setting AI/Groq secrets..."
flyctl secrets set AI_API_KEY="${AI_API_KEY:-YOUR_GROQ_API_KEY}" --app "$APP_NAME"
flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions --app "$APP_NAME"
flyctl secrets set AI_MODEL=llama-3.3-70b-versatile --app "$APP_NAME"
echo "✅ AI secrets set"

# Get app URL and set CORS
APP_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "")
if [ -z "$APP_URL" ]; then
    APP_URL="${APP_NAME}.fly.dev"
fi

flyctl secrets set CORS_ORIGINS="https://${APP_URL}" --app "$APP_NAME"
echo "✅ CORS set to: https://${APP_URL}"

# Step 5: Deploy
echo ""
echo "🚀 Step 5: Deploying to Fly.io..."
echo "⏳ This may take 5-10 minutes..."
echo ""

flyctl deploy --app "$APP_NAME" --remote-only

# Get final URL
FINAL_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "${APP_NAME}.fly.dev")

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "🌐 Your app is live at: https://${FINAL_URL}"
echo ""
echo "📝 GitHub Repository:"
echo "   https://github.com/RachitJava/resume-builder"
echo ""
echo "📊 Useful Commands:"
echo "   flyctl logs --app $APP_NAME        # View logs"
echo "   flyctl status --app $APP_NAME      # Check status"
echo "   flyctl open --app $APP_NAME        # Open in browser"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "   Your GitHub token was used in this script."
echo "   Consider revoking and creating a new token at:"
echo "   https://github.com/settings/tokens"
echo ""
echo "🎉 Happy coding!"

