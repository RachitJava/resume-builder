#!/bin/bash
# Exact commands adapted to push entire project

cd /Users/rachit/resume-builder

# Create README if doesn't exist
echo "# resume-builder" >> README.md
echo "" >> README.md
echo "Full-stack resume builder with AI features, Fly.io deployment ready." >> README.md

# Initialize Git
git init

# Add ALL files (not just README)
git add .

# Commit all files
git commit -m "first commit"

# Use main branch (modern standard) - but we'll also try master if main fails
git branch -M main 2>/dev/null || git branch -M master

# Add remote with token authentication
GITHUB_TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN}"
git remote add origin https://${GITHUB_TOKEN}@github.com/RachitJava/resume-builder.git 2>/dev/null || \
git remote set-url origin https://${GITHUB_TOKEN}@github.com/RachitJava/resume-builder.git

# Push to GitHub (try main first, then master)
git push -u origin main 2>&1 || git push -u origin master 2>&1

echo ""
echo "✅ Done! Check: https://github.com/RachitJava/resume-builder"

