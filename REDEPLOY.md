# Redeployment Guide

The project is now optimized and ready for production deployment. All sensitive configurations have been moved to the database with secure fallback mechanisms.

## 1. Key Improvements for Production
- **Database-Driven Keys**: All API keys (Groq, Mail) are now managed in the database.
- **Production Database**: Uses PostgreSQL on Fly.io. A dedicated user `resumebuilder` was created manually.
  - **Connection**: Configured via secrets (`DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`).
- **Seeded Configs**: The `DatabaseInitializer` automatically seeds the required Groq and Mail keys if they are missing.
- **Permanent Admins**: Administrative accounts (`rachitbishnoi28@gmail.com` and `rachitbishnoi16@gmail.com`) are auto-initialized.
- **Aggressive Cleanup**: Any legacy `GEMINI-BROWSER` or browser-session configs are automatically purged on startup.
- **Theme Persistence**: Theme selection (Day/Night) is now persistent across the entire application.
- **Dynamic Template Previews**: Real-time generated image previews for all templates are now served via a new public API endpoint, replacing static placeholders.

## 2. Environment Variables
When deploying (e.g., to Fly.io, Heroku, or a VPS), you should set the following environment variables to ensure security:

| Variable | Description |
| :--- | :--- |
| `DB_PASSWORD` | Password for the database (H2 file is default) |
| `MAIL_USERNAME` | Your Gmail address (`rachitbishnoi16@gmail.com`) |
| `MAIL_PASSWORD` | Your Gmail App Password |
| `AI_API_KEY` | Your Groq API Key |
| `CORS_ORIGINS` | Your production URL (e.g., `https://your-app.fly.dev`) |

## 3. How to Deploy
1. **Build the Container**: The root `Dockerfile` is pre-configured to build both the frontend and backend.
   ```bash
   docker build -t resume-builder .
   ```
2. **Run the Container**:
   ```bash
   docker run -p 8080:8080 -e AI_API_KEY=your_key -e MAIL_PASSWORD=your_app_pass resume-builder
   ```

## 4. Post-Deployment Verification
- Log in with your admin email.
- Access the **Admin Dashboard** (`/admin`) to verify the **AI Strategies** and **System API Keys**.
- Toggle the theme to ensure it persists.
- Test the **Job Match** and **Resume Upload** to confirm AI connectivity.
