# BQOM Backend - Production Dockerfile
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create backups directory
RUN mkdir -p /app/backups

# Copy the pre-built JAR file
COPY app.jar app.jar

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
