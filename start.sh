#!/bin/sh
set -eu

cd "$(dirname "$0")"

echo "Detecting Node runtime for backend..."

if command -v npm >/dev/null 2>&1; then
  echo "Installing backend dependencies..."
  npm install --prefix backend

  echo "Starting backend server..."
  exec npm start --prefix backend
fi

NODE_BIN="$HOME/node/bin/node"

if [ ! -x "$NODE_BIN" ]; then
  echo "No npm found; installing Node.js locally..."
  mkdir -p "$HOME/node"
  DOWNLOAD_URL="https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$DOWNLOAD_URL" -o "$HOME/node/node.tar.xz"
  elif command -v wget >/dev/null 2>&1; then
    wget -q "$DOWNLOAD_URL" -O "$HOME/node/node.tar.xz"
  else
    echo "Error: neither npm nor curl/wget available; cannot install Node."
    exit 1
  fi

  tar -xf "$HOME/node/node.tar.xz" --strip-components=1 -C "$HOME/node"
fi

export PATH="$HOME/node/bin:$PATH"

echo "Installing backend dependencies with bundled npm..."
npm install --prefix backend

echo "Starting backend server with bundled node..."
exec npm start --prefix backend
