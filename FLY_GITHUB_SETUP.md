# 🚀 Connect GitHub with Fly.io for Auto-Deployment

Your code is now on GitHub at: **https://github.com/RachitJava/resume-builder**

## Step 1: Deploy to Fly.io (First Time)

### Option A: Using Fly.io Dashboard (Easiest)

1. **Go to Fly.io Dashboard**: https://fly.io/apps
2. **Click "Create App"** or **"New App"**
3. **Choose**: "Deploy from GitHub"
4. **Select Repository**: `RachitJava/resume-builder`
5. **App Name**: `resume-builder-app` (or your choice)
6. **Region**: Choose closest (e.g., `iad` for US East)
7. **Click "Deploy"**

### Option B: Using Fly.io CLI

```bash
cd /Users/rachit/resume-builder

# Make sure you're authenticated
flyctl auth login

# Launch app (connects to GitHub automatically)
flyctl launch --name resume-builder-app --region iad

# When prompted:
# - Copy configuration from existing app? No
# - Postgres? No
# - Redis? No
# - Deploy now? Yes
```

---

## Step 2: Connect GitHub Repository (If Not Auto-Connected)

If the app was created but not connected to GitHub:

### Via Dashboard:

1. Go to your app: https://fly.io/apps/resume-builder-app
2. Click **"Source"** tab
3. Click **"Connect to GitHub"**
4. Authorize Fly.io to access your repositories
5. Select: `RachitJava/resume-builder`
6. Choose branch: `main`
7. Click **"Connect"**

### Via CLI:

```bash
# Link GitHub repository
flyctl releases --app resume-builder-app

# Or create with GitHub link
flyctl apps create resume-builder-app --org personal
flyctl github connect --app resume-builder-app
```

---

## Step 3: Set Environment Variables (Secrets)

### Via Dashboard:

1. Go to: https://fly.io/apps/resume-builder-app/settings/secrets
2. Click **"Set Secret"** for each:

   - **MAIL_USERNAME**: `rachitbishnoi16@gmail.com`
   - **MAIL_PASSWORD**: `your-gmail-app-password`
   - **AI_API_KEY**: `YOUR_GROQ_API_KEY`
   - **AI_API_URL**: `https://api.groq.com/openai/v1/chat/completions`
   - **AI_MODEL**: `llama-3.3-70b-versatile`
   - **CORS_ORIGINS**: `https://resume-builder-app.fly.dev` (update after first deploy)

### Via CLI:

```bash
flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com --app resume-builder-app
flyctl secrets set MAIL_PASSWORD=your-gmail-password --app resume-builder-app
flyctl secrets set AI_API_KEY=YOUR_GROQ_API_KEY --app resume-builder-app
flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions --app resume-builder-app
flyctl secrets set AI_MODEL=llama-3.3-70b-versatile --app resume-builder-app
flyctl secrets set CORS_ORIGINS=https://resume-builder-app.fly.dev --app resume-builder-app
```

---

## Step 4: Enable Auto-Deploy from GitHub

### Via Dashboard:

1. Go to: https://fly.io/apps/resume-builder-app
2. Click **"Source"** tab
3. Toggle **"Automatically deploy from GitHub"**
4. Select branch: `main`
5. Save

### Via CLI:

Auto-deploy is usually enabled by default when connecting GitHub.

To check:
```bash
flyctl releases --app resume-builder-app
```

---

## Step 5: First Deployment

### If using Dashboard:
1. After connecting GitHub, click **"Deploy Now"**
2. Or push to `main` branch → Auto-deploys!

### If using CLI:
```bash
# Deploy from GitHub
flyctl deploy --app resume-builder-app --remote-only

# Or push to GitHub (triggers auto-deploy if enabled)
git push origin main
```

---

## How Auto-Deployment Works

Once connected:
- ✅ **Every push to `main` branch** → Automatic deployment
- ✅ **Pull requests** → Preview deployments (optional)
- ✅ **Manual deploy** → Via dashboard or CLI

---

## Update CORS After First Deploy

After first deployment, get your app URL:

```bash
flyctl status --app resume-builder-app
```

Then update CORS:

```bash
flyctl secrets set CORS_ORIGINS=https://YOUR-APP-URL.fly.dev --app resume-builder-app
```

---

## Verify Deployment

```bash
# Check status
flyctl status --app resume-builder-app

# View logs
flyctl logs --app resume-builder-app

# Open in browser
flyctl open --app resume-builder-app
```

---

## GitHub Actions (Alternative - Already Configured)

Your `.github/workflows/deploy.yml` is already set up!

To use it:
1. Go to GitHub repo: https://github.com/RachitJava/resume-builder
2. Settings → Secrets and variables → Actions
3. Add secret: `FLY_API_TOKEN` = (get from `flyctl auth token`)
4. Push to `main` → GitHub Actions deploys automatically!

---

## Troubleshooting

### "Repository not found"
- Make sure Fly.io has access to your GitHub account
- Re-authorize at: https://fly.io/apps/resume-builder-app/settings/source

### "Deployment failed"
- Check logs: `flyctl logs --app resume-builder-app`
- Verify secrets are set: `flyctl secrets list --app resume-builder-app`

### "Cannot connect to GitHub"
- Go to Fly.io settings: https://fly.io/user/settings
- Disconnect and reconnect GitHub

---

**Your app will be live at:** `https://resume-builder-app.fly.dev` (or your app name)

**GitHub Repository:** https://github.com/RachitJava/resume-builder

🎉 **Happy deploying!**

