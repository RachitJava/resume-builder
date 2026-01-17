#!/bin/bash
# Direct Fly.io deployment script

set -e

echo "🚀 Deploying Resume Builder to Fly.io"
echo "======================================"
echo ""

cd /Users/rachit/resume-builder

# Add flyctl to PATH
export PATH="$HOME/.fly/bin:$PATH"

APP_NAME="resume-builder-app"

# Step 1: Check/Install flyctl
if ! command -v flyctl &> /dev/null; then
    echo "📥 Installing Fly.io CLI..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
    
    # Check if installed
    if ! command -v flyctl &> /dev/null; then
        echo "⚠️  Please restart terminal or run: export PATH=\"\$HOME/.fly/bin:\$PATH\""
        echo "Then run: flyctl auth login"
        exit 1
    fi
fi

echo "✅ Fly.io CLI is ready"

# Step 2: Check authentication
echo ""
echo "🔐 Checking authentication..."
if ! flyctl auth whoami &> /dev/null; then
    echo "⚠️  Not authenticated via CLI"
    echo "Run: flyctl auth login"
    echo "This will open your browser to authenticate"
    exit 1
fi

echo "✅ Authenticated as: $(flyctl auth whoami)"

# Step 3: Create app if it doesn't exist
echo ""
echo "🆕 Setting up app: $APP_NAME"

if ! flyctl status --app "$APP_NAME" &>/dev/null 2>&1; then
    echo "Creating new app..."
    flyctl apps create "$APP_NAME" --org personal || true
    echo "✅ App created"
else
    echo "✅ App already exists"
fi

# Step 4: Set secrets (non-interactive where possible)
echo ""
echo "🔑 Setting environment variables..."

# Set AI secrets (using default key)
flyctl secrets set AI_API_KEY="${AI_API_KEY:-YOUR_GROQ_API_KEY}" --app "$APP_NAME" || true
flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions --app "$APP_NAME" || true
flyctl secrets set AI_MODEL=llama-3.3-70b-versatile --app "$APP_NAME" || true

# Set email username
flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com --app "$APP_NAME" || true

# Get app URL for CORS (may need to create first)
APP_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "${APP_NAME}.fly.dev")
flyctl secrets set CORS_ORIGINS="https://${APP_URL}" --app "$APP_NAME" || true

echo "✅ Secrets set (note: MAIL_PASSWORD needs to be set separately)"
echo ""
echo "To set Gmail password later, run:"
echo "  flyctl secrets set MAIL_PASSWORD=your-password --app $APP_NAME"

# Step 5: Deploy
echo ""
echo "🚀 Deploying application..."
echo "⏳ This will take 5-10 minutes..."
echo ""

flyctl deploy --app "$APP_NAME" --remote-only

# Step 6: Get final URL and update CORS
FINAL_URL=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4 || echo "${APP_NAME}.fly.dev")

# Update CORS with actual URL
flyctl secrets set CORS_ORIGINS="https://${FINAL_URL}" --app "$APP_NAME" || true

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "🌐 Your app is live at: https://${FINAL_URL}"
echo ""
echo "📝 Next steps:"
echo "   1. Set Gmail password: flyctl secrets set MAIL_PASSWORD=your-password --app $APP_NAME"
echo "   2. Visit your app: flyctl open --app $APP_NAME"
echo ""
echo "📊 Useful commands:"
echo "   flyctl logs --app $APP_NAME        # View logs"
echo "   flyctl status --app $APP_NAME      # Check status"
echo "   flyctl open --app $APP_NAME        # Open in browser"
echo ""

