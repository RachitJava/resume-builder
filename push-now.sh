#!/bin/bash
# Push to GitHub with new token

set -e

cd /Users/rachit/resume-builder

echo "🚀 Pushing Resume Builder to GitHub..."
echo ""

# Initialize Git
git init 2>/dev/null || true
git branch -M main 2>/dev/null || true

# Add files
echo "📝 Adding files..."
git add .

# Commit
echo "💾 Committing..."
git commit -m "Initial commit: Resume Builder app with Fly.io deployment" 2>/dev/null || \
git commit -m "Update: Resume Builder app" 2>/dev/null || \
echo "Already committed"

# Set remote with new token
GITHUB_TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN}"
GITHUB_URL="https://${GITHUB_TOKEN}@github.com/RachitJava/resume-builder.git"

echo "🔗 Setting remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL" 2>/dev/null || \
git remote set-url origin "$GITHUB_URL"

echo "📤 Pushing to GitHub..."
git push -u origin main --force 2>&1 || git push -u origin main 2>&1

echo ""
echo "✅ Push complete!"
echo "🌐 Repository: https://github.com/RachitJava/resume-builder"
echo ""

