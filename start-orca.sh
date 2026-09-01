#!/bin/bash
# ORCA 4.0 One-Click Startup Script (macOS / Linux)

echo "=================================================="
echo "    STARTING ORCA 4.0 MARINE OPERATING SYSTEM     "
echo "=================================================="

# Kill any existing processes on ports 8000 and 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# 1. Start Backend FastAPI Server
echo "-> Starting Backend FastAPI Server on http://localhost:8000..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
python3 main.py &
BACKEND_PID=$!
cd ..

# 2. Start Frontend React Vite App
echo "-> Starting Frontend React PWA on http://localhost:5173..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=================================================="
echo "  ORCA 4.0 IS LIVE & RUNNING!"
echo "  • Web Interface:  http://localhost:5173"
echo "  • Backend API:    http://localhost:8000"
echo "  • Interactive Demo Links:"
echo "    - Safe Trip (Goa):     http://localhost:5173/?demo=safe"
echo "    - High Risk (Mumbai):  http://localhost:5173/?demo=danger"
echo "    - Cyclone Override:    http://localhost:5173/?demo=cyclone"
echo "=================================================="
echo "Press CTRL+C to stop all servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'ORCA Servers Stopped.'; exit 0" INT
wait
