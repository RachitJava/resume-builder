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

COPY backend/ ./backend
RUN mvn clean package -DskipTests

# Stage 3: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built backend JAR
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./static

# Create data directory for H2 database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/resumes || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

