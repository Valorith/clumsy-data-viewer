#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Installing backend dependencies..."
npm install --prefix backend

echo "Starting backend server..."
npm start --prefix backend
