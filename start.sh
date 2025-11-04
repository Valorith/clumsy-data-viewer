#!/bin/sh
set -eu

cd "$(dirname "$0")"

export NODE_ENV="${NODE_ENV:-production}"

echo "Installing backend dependencies..."
npm install --prefix backend

echo "Installing frontend dependencies..."
npm install --prefix frontend

echo "Building frontend..."
npm run build --prefix frontend

echo "Syncing frontend build into backend/public..."
rm -rf backend/public
mkdir -p backend/public
cp -R frontend/dist/. backend/public/

echo "Starting backend server..."
exec npm start --prefix backend
