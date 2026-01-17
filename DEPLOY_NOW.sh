#!/bin/bash
# Quick script to verify GitHub push and prepare for Fly.io

set -e

echo "🔍 Checking GitHub Status"
echo "========================"
echo ""

cd /Users/rachit/resume-builder

# Check git status
echo "📦 Git Status:"
git status --short 2>&1 || echo "Not a git repo"

echo ""
echo "🔗 Remote Repository:"
git remote -v 2>&1 || echo "No remote configured"

echo ""
echo "📤 Latest Commit:"
git log --oneline -1 2>&1 || echo "No commits yet"

echo ""
echo "========================================"
echo ""
echo "✅ Your code should be on GitHub at:"
echo "   https://github.com/RachitJava/resume-builder"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Go to Fly.io Dashboard:"
echo "   https://fly.io/apps"
echo ""
echo "2. Click 'Create App' → 'Deploy from GitHub'"
echo ""
echo "3. Select: RachitJava/resume-builder"
echo ""
echo "4. Or use CLI:"
echo "   flyctl launch --name resume-builder-app --region iad"
echo ""
echo "5. Set secrets:"
echo "   flyctl secrets set AI_API_KEY=... --app resume-builder-app"
echo "   flyctl secrets set MAIL_USERNAME=... --app resume-builder-app"
echo "   flyctl secrets set MAIL_PASSWORD=... --app resume-builder-app"
echo ""
echo "See FLY_GITHUB_SETUP.md for detailed instructions!"
echo ""

