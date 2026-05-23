#!/bin/sh
set -eu

cd "$(dirname "$0")"

export NODE_ENV="${NODE_ENV:-production}"

echo "Installing backend dependencies..."
npm ci --prefix backend --omit=dev

echo "Installing frontend dependencies..."
npm ci --prefix frontend --include=dev

echo "Building frontend..."
npm run build --prefix frontend

echo "Syncing frontend build into backend/public..."
rm -rf backend/public
mkdir -p backend/public
cp -R frontend/dist/. backend/public/

echo "Starting backend server..."
cd backend
exec node server.js
