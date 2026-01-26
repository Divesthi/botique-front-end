#!/bin/bash

#====================================================
#  BQOM - Boutique Order Management System
#  START SCRIPT (Mac/Linux)
#====================================================

echo ""
echo "=========================================="
echo "  BQOM - Starting Application"
echo "=========================================="
echo ""

# Change to the script directory
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo ""
    exit 1
fi

echo "[INFO] Docker is running. Starting BQOM services..."
echo ""

# Start all services
docker compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  BQOM Started Successfully!"
    echo "=========================================="
    echo ""
    echo "  Please wait 1-2 minutes for all services to be ready."
    echo ""
    echo "  Access the application at:"
    echo "  --> http://localhost"
    echo ""
    echo "  Backend API available at:"
    echo "  --> http://localhost:8080"
    echo ""
    echo "  To check service status, run:"
    echo "  --> docker compose ps"
    echo ""
    echo "  To view logs, run:"
    echo "  --> docker compose logs -f"
    echo ""
    echo "=========================================="
else
    echo ""
    echo "[ERROR] Failed to start BQOM services."
    echo "Please check the error messages above."
    echo ""
    exit 1
fi
