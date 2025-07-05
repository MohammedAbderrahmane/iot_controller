#!/bin/bash
DEV_COMMAND="npm run dev"
NODE_MODULES_DIR="node_modules"

cd server

cd maabe

compile_if_exists() {
  local source_file="$1"
  local output_name="$2"

  if [ -f "$output_name" ]; then
    echo "✅ '$output_name' arleady compiled. Skipping compilation."
  else
    echo "Compiling $source_file..."
    go build -o "$output_name" "$source_file"
    if [ $? -eq 0 ]; then
      echo "  ✅ Successfully compiled $output_name"
    else
      echo "❌ Error compiling $source_file. Exiting."
      exit 1
    fi
  fi
}

echo "➰ Installing MAABE scripts"

compile_if_exists "add_attribute.go" "add_attribute"
compile_if_exists "create_authority.go" "create_authority"
compile_if_exists "generate_keys.go" "generate_keys"
compile_if_exists "renew_attribute.go" "renew_attribute"
echo "✅ MAABE scripts insatlled successfully"
echo ""
cd ..

# Check if the node_modules directory exists
if [ ! -d "$NODE_MODULES_DIR" ]; then
  echo "➰ Running 'npm install'..."
  npm install
  if [ $? -eq 0 ]; then
    echo "✅'npm install' completed successfully."
  else
    echo "📛 Error: 'npm install' failed."
    exit 1
  fi
else
  echo "✅ Directory '$NODE_MODULES_DIR' already exists. Skipping 'npm install'."
fi
$DEV_COMMAND &
SERVER_PID=$!
echo "Node.js server started with PID: $SERVER_PID"

cd ../client 
echo "Navigating to ./client and starting the frontend development server..."
if [ ! -d "$NODE_MODULES_DIR" ]; then
  echo "➰ Running 'npm install'..."
  npm install
  if [ $? -eq 0 ]; then
    echo "'✅ npm install' completed successfully."
  else
    echo "📛 Error: 'npm install' failed."
    exit 1
  fi
else
  echo "✅ Directory '$NODE_MODULES_DIR' already exists. Skipping 'npm install'."
fi
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
