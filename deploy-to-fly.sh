#!/bin/bash
# Complete deployment script for GitHub and Fly.io

set -e

echo "🚀 Resume Builder - GitHub & Fly.io Deployment"
echo "================================================"
echo ""

cd /Users/rachit/resume-builder

# Step 1: Git Setup
echo "📦 Step 1: Setting up Git..."

if [ ! -d .git ]; then
    git init
    echo "✅ Git initialized"
fi

git branch -M main

# Add all files
git add .

# Check if there are changes to commit
if ! git diff --cached --quiet || ! git diff --quiet; then
    git commit -m "Initial commit: Resume Builder app with Fly.io deployment setup" || \
    git commit -m "Update: Resume Builder app with Fly.io deployment setup"
    echo "✅ Changes committed"
else
    echo "✅ No new changes to commit"
fi

# Set remote
GITHUB_URL="https://github.com/RachitJava/resume-builder.git"
if git remote get-url origin &>/dev/null; then
    git remote set-url origin "$GITHUB_URL"
    echo "✅ Remote updated: $GITHUB_URL"
else
    git remote add origin "$GITHUB_URL"
    echo "✅ Remote added: $GITHUB_URL"
fi

# Step 2: Push to GitHub
echo ""
echo "📤 Step 2: Pushing to GitHub..."

if git push -u origin main 2>&1; then
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: https://github.com/RachitJava/resume-builder"
else
    echo "⚠️  Git push may have failed. This might require authentication."
    echo "   You may need to:"
    echo "   - Use a Personal Access Token: https://github.com/settings/tokens"
    echo "   - Or run: git remote set-url origin https://YOUR_TOKEN@github.com/RachitJava/resume-builder.git"
    echo ""
    read -p "Continue with Fly.io deployment? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Step 3: Fly.io Setup
echo ""
echo "🌐 Step 3: Setting up Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed!"
    echo ""
    echo "Installing flyctl..."
    curl -L https://fly.io/install.sh | sh
    
    # Add to PATH for current session
    export PATH="$HOME/.fly/bin:$PATH"
    
    if ! command -v flyctl &> /dev/null; then
        echo "⚠️  Installation may require restart. Please run manually:"
        echo "   curl -L https://fly.io/install.sh | sh"
        echo "   Then restart your terminal and run this script again."
        exit 1
    fi
    echo "✅ flyctl installed"
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io..."
    flyctl auth login
fi

echo "✅ Logged in to Fly.io as: $(flyctl auth whoami)"

# Step 4: Create or use existing app
APP_NAME="resume-builder-app"
echo ""
echo "🆕 Step 4: Setting up Fly.io app: $APP_NAME"

if ! flyctl status --app "$APP_NAME" &>/dev/null; then
    echo "Creating new app..."
    flyctl launch --name "$APP_NAME" --region iad --no-config --copy-config || {
        # If launch fails, create manually
        echo "Creating app manually..."
        flyctl apps create "$APP_NAME" || true
    }
    echo "✅ App created"
else
    echo "✅ App already exists"
fi

# Step 5: Set Secrets
echo ""
echo "🔑 Step 5: Setting environment variables..."

# Email secrets
if [ -z "$MAIL_PASSWORD" ]; then
    read -sp "Enter Gmail App Password (or press Enter to skip): " MAIL_PASS
    echo ""
    if [ ! -z "$MAIL_PASS" ]; then
        flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com --app "$APP_NAME" -y
        flyctl secrets set MAIL_PASSWORD="$MAIL_PASS" --app "$APP_NAME" -y
        echo "✅ Email secrets set"
    fi
fi

# AI secrets (use default if not provided)
read -p "Enter Groq API Key (or press Enter to use default): " AI_KEY
if [ -z "$AI_KEY" ]; then
    echo "⚠️  No API key provided. Please set via: flyctl secrets set AI_API_KEY=YOUR_KEY --app $APP_NAME"
    AI_KEY="YOUR_GROQ_API_KEY"
fi

flyctl secrets set AI_API_KEY="$AI_KEY" --app "$APP_NAME" -y
flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions --app "$APP_NAME" -y
flyctl secrets set AI_MODEL=llama-3.3-70b-versatile --app "$APP_NAME" -y
echo "✅ AI secrets set"

# Get app URL and set CORS
APP_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "")
if [ -z "$APP_URL" ]; then
    APP_URL="${APP_NAME}.fly.dev"
fi

flyctl secrets set CORS_ORIGINS="https://${APP_URL}" --app "$APP_NAME" -y
echo "✅ CORS set to: https://${APP_URL}"

# Step 6: Deploy
echo ""
echo "🚀 Step 6: Deploying to Fly.io..."
echo "This may take a few minutes..."

flyctl deploy --app "$APP_NAME" --remote-only

# Get final app URL
FINAL_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "${APP_NAME}.fly.dev")

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "🌐 Your app is live at: https://${FINAL_URL}"
echo ""
echo "📊 Useful Commands:"
echo "   flyctl logs --app $APP_NAME        # View logs"
echo "   flyctl status --app $APP_NAME      # Check status"
echo "   flyctl open --app $APP_NAME        # Open in browser"
echo "   flyctl secrets list --app $APP_NAME # View secrets"
echo ""
echo "📝 GitHub Repository:"
echo "   https://github.com/RachitJava/resume-builder"
echo ""
echo "🎉 Happy coding!"

