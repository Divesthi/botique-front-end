#!/bin/bash

#====================================================
#  BQOM - Boutique Order Management System
#  STOP SCRIPT (Mac/Linux)
#====================================================

echo ""
echo "=========================================="
echo "  BQOM - Stopping Application"
echo "=========================================="
echo ""

# Change to the script directory
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running!"
    echo "The application may already be stopped."
    echo ""
    exit 1
fi

echo "[INFO] Stopping BQOM services..."
echo ""

# Stop all services
docker compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  BQOM Stopped Successfully!"
    echo "=========================================="
    echo ""
    echo "  Note: Your data is safely preserved."
    echo "  Run ./start.sh to start the application again."
    echo ""
    echo "=========================================="
else
    echo ""
    echo "[ERROR] Failed to stop BQOM services."
    echo "Please check the error messages above."
    echo ""
    exit 1
fi
