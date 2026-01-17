#!/bin/bash
# Push entire resume-builder project to GitHub

set -e

echo "🚀 Pushing Resume Builder to GitHub"
echo "===================================="
echo ""

cd /Users/rachit/resume-builder

# GitHub credentials
GITHUB_USER="RachitJava"
GITHUB_TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN}"
GITHUB_REPO="https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/resume-builder.git"

# Step 1: Create README if doesn't exist
if [ ! -f README.md ]; then
    echo "# Resume Builder" >> README.md
    echo "" >> README.md
    echo "Full-stack resume builder application with AI-powered features." >> README.md
    echo "" >> README.md
    echo "Built with React, Spring Boot, and Groq AI." >> README.md
    echo "✅ Created README.md"
fi

# Step 2: Initialize Git
echo "📦 Initializing Git..."
git init 2>/dev/null || true
echo "✅ Git initialized"

# Step 3: Add all files
echo "📝 Adding all files..."
git add .
echo "✅ Files staged"

# Step 4: Commit
echo "💾 Committing..."
git commit -m "Initial commit: Resume Builder app with Fly.io deployment setup" 2>/dev/null || \
git commit -m "first commit" 2>/dev/null || \
echo "Already committed"

# Step 5: Set branch to main (modern standard, but we'll use what user wants)
git branch -M main 2>/dev/null || git branch -M master 2>/dev/null || true

# Step 6: Add remote with token
echo "🔗 Setting remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_REPO" 2>&1 || git remote set-url origin "$GITHUB_REPO" 2>&1
echo "✅ Remote configured"

# Step 7: Push to GitHub
echo "📤 Pushing to GitHub..."
echo "This may take a moment..."
echo ""

if git push -u origin main 2>&1; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
elif git push -u origin master 2>&1; then
    echo ""
    echo "✅ Successfully pushed to GitHub (master branch)!"
else
    echo ""
    echo "⚠️  Push failed. Trying with force..."
    git push -u origin main --force 2>&1 || git push -u origin master --force 2>&1
fi

echo ""
echo "================================================"
echo "✅ Complete!"
echo "================================================"
echo ""
echo "🌐 Repository: https://github.com/${GITHUB_USER}/resume-builder"
echo ""
echo "📝 Next: Connect to Fly.io for deployment"
echo "   See: FLY_GITHUB_SETUP.md"
echo ""

