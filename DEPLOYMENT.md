# 🚀 Deployment Guide - Resume Builder on Fly.io

## Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io
2. **Fly CLI**: Install from https://fly.io/docs/getting-started/installing-flyctl/
3. **GitHub Account**: For CI/CD
4. **Docker**: (optional, Fly.io builds from Dockerfile)

## Step 1: Install Fly.io CLI

```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Verify installation
flyctl version
```

## Step 2: Login to Fly.io

```bash
flyctl auth login
```

## Step 3: Initialize Fly.io App

```bash
cd /Users/rachit/resume-builder
flyctl launch
```

**When prompted:**
- App name: `resume-builder-app` (or your choice)
- Region: Choose closest to your users (e.g., `iad` for US East, `sjc` for US West)
- Postgres: `No` (we're using H2 file-based database)
- Redis: `No`

## Step 4: Set Environment Variables

```bash
# Email Configuration
flyctl secrets set MAIL_USERNAME=rachitbishnoi16@gmail.com
flyctl secrets set MAIL_PASSWORD=your-gmail-app-password

# AI Configuration
flyctl secrets set AI_API_KEY=your-groq-api-key
flyctl secrets set AI_API_URL=https://api.groq.com/openai/v1/chat/completions
flyctl secrets set AI_MODEL=llama-3.3-70b-versatile

# CORS Configuration (update with your fly.io domain)
flyctl secrets set CORS_ORIGINS=https://resume-builder-app.fly.dev

# Optional: Database password
flyctl secrets set DB_PASSWORD=your-secure-password
```

## Step 5: Configure GitHub Secrets (for CI/CD)

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Add the following secrets:

   - `FLY_API_TOKEN`: Get from `flyctl auth token`

## Step 6: Deploy

### Manual Deployment:
```bash
flyctl deploy
```

### Automatic Deployment via GitHub:
- Push to `main` or `master` branch
- GitHub Actions will automatically deploy

## Step 7: Check Status

```bash
# View app status
flyctl status

# View logs
flyctl logs

# Open app in browser
flyctl open
```

## Step 8: Database Persistence

H2 database files are stored in `/app/data` directory which is **ephemeral** on Fly.io.

### Option 1: Use Fly Volumes (Recommended for Production)

```bash
# Create a volume
flyctl volumes create data --size 1 --region iad

# Attach volume to app
flyctl volumes attach data --app resume-builder-app
```

Update `fly.toml`:
```toml
[mounts]
  source = "data"
  destination = "/app/data"
```

### Option 2: Use Postgres (For Production)

```bash
# Create Postgres database
flyctl postgres create --name resume-builder-db

# Attach to app
flyctl postgres attach resume-builder-db --app resume-builder-app
```

Update `application-prod.properties` to use Postgres connection string.

## Troubleshooting

### Build Fails
```bash
# Build locally to test
docker build -t resume-builder .
docker run -p 8080:8080 resume-builder
```

### App Won't Start
```bash
# Check logs
flyctl logs

# SSH into machine
flyctl ssh console

# Check disk space
flyctl ssh console -C "df -h"
```

### Static Files Not Loading
- Ensure frontend build is included in Docker image
- Check `/app/static` directory exists
- Verify `StaticResourceConfig.java` is configured

### Environment Variables Not Working
```bash
# List all secrets
flyctl secrets list

# View app info
flyctl status
```

## Scaling

```bash
# Scale up
flyctl scale count 2

# Scale down
flyctl scale count 1

# Increase memory
flyctl scale vm shared-cpu-2x --memory 1024
```

## Monitoring

```bash
# View metrics
flyctl metrics

# View status
flyctl status

# Open dashboard
flyctl dashboard
```

## Custom Domain

```bash
# Add custom domain
flyctl certs add your-domain.com

# Update CORS_ORIGINS
flyctl secrets set CORS_ORIGINS=https://your-domain.com
```

## Rollback

```bash
# View releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

## Cost Estimation

Fly.io free tier includes:
- 3 shared-cpu-1x VMs with 256MB RAM
- 160GB outbound data transfer

For this app:
- 1 VM with 512MB RAM: ~$2-3/month
- Additional traffic: As needed

## Support

- Fly.io Docs: https://fly.io/docs
- Fly.io Community: https://community.fly.io
- GitHub Issues: Report deployment issues

---

**Your app will be live at:** `https://resume-builder-app.fly.dev` (replace with your app name)

