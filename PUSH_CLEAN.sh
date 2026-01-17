#!/bin/bash
# Clean push to GitHub (without secrets in history)

set -e

cd /Users/rachit/resume-builder

echo "🧹 Preparing clean push to GitHub..."
echo ""

# Remove old git history (which contains secrets)
echo "📦 Removing old git history with secrets..."
rm -rf .git

# Initialize fresh git repo
echo "📦 Initializing fresh Git repository..."
git init
git branch -M master

# Add all files
echo "📝 Adding files..."
git add .

# Commit
echo "💾 Committing..."
git commit -m "Initial commit: Resume Builder app with Fly.io deployment"

# Set remote with token from environment variable
# User should run: export GITHUB_TOKEN=your_token before running this script
if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "⚠️  GITHUB_TOKEN environment variable not set!"
    echo ""
    echo "Run these commands:"
    echo "  export GITHUB_TOKEN=YOUR_GITHUB_TOKEN"
    echo "  ./PUSH_CLEAN.sh"
    echo ""
    echo "Or push manually:"
    echo "  git remote add origin https://YOUR_TOKEN@github.com/RachitJava/resume-builder.git"
    echo "  git push -u origin master --force"
    exit 1
fi

echo "🔗 Setting remote..."
git remote add origin "https://${GITHUB_TOKEN}@github.com/RachitJava/resume-builder.git"

# Force push (to overwrite existing history with secrets)
echo "📤 Pushing to GitHub (force push)..."
git push -u origin master --force

echo ""
echo "✅ Successfully pushed clean code to GitHub!"
echo "🌐 Repository: https://github.com/RachitJava/resume-builder"
echo ""
echo "📝 Next: Deploy to Fly.io"
echo "   1. Go to https://fly.io/apps"
echo "   2. Create app from GitHub: RachitJava/resume-builder"
echo "   3. Set secrets via dashboard"
echo ""

