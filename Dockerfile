# Multi-stage build for Resume Builder
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Build with production mode
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Build Backend
FROM maven:3.9-eclipse-temurin-17 AS backend-builder

WORKDIR /app/backend

# Copy backend files
COPY backend/pom.xml .
COPY backend/mvnw* ./
RUN mvn dependency:go-offline -B

# Copy source code (not into subdirectory)
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 3: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl, fonts, chromium, and nodejs for Puppeteer
RUN apk add --no-cache \
  curl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  npm

# Install puppeteer-core (lightweight, uses installed chromium)
# We install it in /app/scripts so the Java service can find the node_modules
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN mkdir -p /app/backend/scripts
WORKDIR /app/backend/scripts
RUN npm init -y && npm install puppeteer-core

WORKDIR /app

# Copy built backend JAR
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Copy PDF generation script
COPY backend/scripts/generate-pdf.js /app/backend/scripts/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./static

# Create data directory for H2 database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Health check using dedicated health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Set environment variables
ENV PORT=8080
ENV JAVA_OPTS="-Xms128m -Xmx256m -XX:+UseSerialGC"

# Run the application with explicit binding
ENTRYPOINT ["sh", "-c", "node /app/backend/scripts/generate-pdf.js & exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -Dserver.address=0.0.0.0 -Dspring.main.lazy-initialization=true -jar app.jar"]

