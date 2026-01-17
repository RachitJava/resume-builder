#!/bin/bash
# Check Git and GitHub status

echo "🔍 Checking Status..."
echo "==================="
echo ""

cd /Users/rachit/resume-builder

echo "📦 Git Status:"
git status 2>&1 | head -10

echo ""
echo "🔗 Remote:"
git remote -v 2>&1

echo ""
echo "📤 Latest Commit:"
git log --oneline -1 2>&1 || echo "No commits"

echo ""
echo "🌐 GitHub Repository:"
echo "https://github.com/RachitJava/resume-builder"
echo ""

