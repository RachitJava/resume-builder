#!/bin/bash
# Script to push code to GitHub with verbose output

set -e

echo "🚀 Pushing Resume Builder to GitHub"
echo "===================================="
echo ""

cd /Users/rachit/resume-builder

# Initialize Git if needed
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
    echo "✅ Git initialized"
fi

# Add all files
echo "📝 Adding files..."
git add .
echo "✅ Files added"

# Commit
echo "💾 Committing files..."
if ! git diff --cached --quiet || ! git diff --quiet; then
    git commit -m "Initial commit: Resume Builder app with Fly.io deployment" 2>&1 || \
    git commit -m "Update: Resume Builder app with deployment setup" 2>&1
    echo "✅ Files committed"
else
    echo "ℹ️  No changes to commit"
fi

# Set remote with token
GITHUB_TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN_HERE}"
GITHUB_URL="https://${GITHUB_TOKEN}@github.com/RachitJava/resume-builder.git"

echo "🔗 Setting remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL" 2>&1 || git remote set-url origin "$GITHUB_URL" 2>&1
echo "✅ Remote configured: https://github.com/RachitJava/resume-builder.git"

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
echo "This may take a moment..."
echo ""

if git push -u origin main 2>&1; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Repository: https://github.com/RachitJava/resume-builder"
    echo ""
    echo "📝 Next: Connect GitHub to Fly.io for auto-deployment"
    echo "   See: FLY_GITHUB_SETUP.md"
    echo ""
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Possible issues:"
    echo "1. Token may be invalid or expired"
    echo "2. Repository may need to be created first"
    echo "3. Network connectivity issue"
    echo ""
    echo "Try manually:"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi

