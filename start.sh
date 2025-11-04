#!/bin/sh
set -eu

cd "$(dirname "$0")"

echo "Installing backend dependencies..."
npm install --prefix backend

echo "Starting backend server..."
npm start --prefix backend
