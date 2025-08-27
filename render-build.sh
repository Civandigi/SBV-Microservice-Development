#!/usr/bin/env bash
# Render Build Script

echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database setup
echo "Setting up database..."
node backend/src/scripts/setup-database.js

echo "Build completed successfully!"