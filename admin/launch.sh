#!/bin/bash
DEV_COMMAND="npm run dev" &

cd server
$DEV_COMMAND &
SERVER_PID=$!
echo "Node.js server started with PID: $SERVER_PID"

cd ../client 
echo "Navigating to ./client and starting the frontend development server..."

$DEV_COMMAND &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"
cd ..

cleanup() {
  echo -e "\nStopping servers..."

  # Stop the server process if it's running
  if [ -n "$SERVER_PID" ] && ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "Stopping Node.js server (PID: $SERVER_PID)..."
    kill $SERVER_PID
    # Optional: wait a bit for the server to shut down gracefully
    # sleep 2
  fi

  # Stop the frontend process if it's running
  if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "Stopping Frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
    # Optional: wait a bit for the frontend process to shut down
    # sleep 2
  fi

  echo "Cleanup complete. Exiting."
  exit 0
}

trap cleanup SIGINT
wait $SERVER_PID $FRONTEND_PID
cleanup
