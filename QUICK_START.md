# 🚀 Quick Start: Push to GitHub & Deploy to Fly.io

## Option 1: Automated Script (Recommended)

Run the setup script:
```bash
cd /Users/rachit/resume-builder
./setup-github-and-deploy.sh
```

The script will:
1. ✅ Initialize Git (if needed)
2. ✅ Commit all files
3. ✅ Create GitHub repo (you'll provide URL)
4. ✅ Push to GitHub
5. ✅ Deploy to Fly.io
6. ✅ Set up environment variables

---

## Option 2: Manual Steps

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `resume-builder`
3. **Don't** initialize with README/license
4. Click "Create repository"

### Step 2: Push to GitHub

```bash
cd /Users/rachit/resume-builder

# Initialize Git (if not done)
git init
git branch -M main

# Add files
git add .

# Commit
git commit -m "Initial commit: Resume Builder app"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/resume-builder.git

# Push
git push -u origin main
```

### Step 3: Install Fly.io CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 4: Login to Fly.io

```bash
flyctl auth login
```

### Step 5: Create Fly.io App

```bash
cd /Users/rachit/resume-builder
flyctl launch
```

**When prompted:**
- App name: `resume-builder-app` (or your choice)
- Region: `iad` (Washington DC) or choose closest
- Postgres: **No**
- Redis: **No**

### Step 6: Set Environment Variables

```bash
# Email
flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com
flyctl secrets set MAIL_PASSWORD=your-gmail-app-password

# AI (Groq) - Replace YOUR_GROQ_API_KEY with your actual key
flyctl secrets set AI_API_KEY=YOUR_GROQ_API_KEY
flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions
flyctl secrets set AI_MODEL=llama-3.3-70b-versatile

# CORS (replace with your actual app URL after first deploy)
flyctl secrets set CORS_ORIGINS=https://resume-builder-app.fly.dev
```

### Step 7: Deploy

```bash
flyctl deploy
```

### Step 8: Update CORS with Actual URL

After first deployment, get your app URL:
```bash
flyctl status
```

Then update CORS:
```bash
flyctl secrets set CORS_ORIGINS=https://YOUR-APP-NAME.fly.dev
```

---

## Setup GitHub Actions (Optional)

1. Get Fly.io token:
   ```bash
   flyctl auth token
   ```

2. Go to GitHub repo → **Settings → Secrets and variables → Actions**

3. Click **"New repository secret"**

4. Add:
   - **Name:** `FLY_API_TOKEN`
   - **Value:** (token from step 1)

5. Push to main branch → Auto-deploys! 🎉

---

## Troubleshooting

### Git Push Failed
```bash
# If using HTTPS, you may need a Personal Access Token
# Generate at: https://github.com/settings/tokens
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/resume-builder.git
```

### Fly.io Deploy Failed
```bash
# Check logs
flyctl logs

# View status
flyctl status

# SSH into machine
flyctl ssh console
```

### Build Issues
```bash
# Test Docker build locally
docker build -t resume-builder .
docker run -p 8080:8080 resume-builder
```

---

## After Deployment

Your app will be live at: `https://YOUR-APP-NAME.fly.dev`

**Useful Commands:**
```bash
flyctl logs              # View logs
flyctl status            # Check status  
flyctl open              # Open in browser
flyctl secrets list      # View secrets
flyctl scale count 2     # Scale up
```

---

**Need help?** Check `DEPLOYMENT.md` for detailed guide!

