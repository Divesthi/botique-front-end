#!/bin/bash

#====================================================
#  BQOM - Boutique Order Management System
#  RESTART SCRIPT (Mac/Linux)
#====================================================

echo ""
echo "=========================================="
echo "  BQOM - Restarting Application"
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

echo "[INFO] Stopping BQOM services..."
docker compose down

echo ""
echo "[INFO] Starting BQOM services..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  BQOM Restarted Successfully!"
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
    echo "=========================================="
else
    echo ""
    echo "[ERROR] Failed to restart BQOM services."
    echo "Please check the error messages above."
    echo ""
    exit 1
fi
