#!/usr/bin/env bash

# Shell script equivalent for macOS / Linux users
echo "==================================================="
echo "Starting SAKAR CRM Application (Backend + Frontend)"
echo "==================================================="
echo ""

# Start backend in background
(cd "$(dirname "$0")/backend" && npm run dev) &
BACKEND_PID=$!

# Start frontend in background
(cd "$(dirname "$0")/frontend" && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "Backend API running (PID: $BACKEND_PID) -> http://localhost:4000"
echo "Frontend Web App running (PID: $FRONTEND_PID) -> http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
