#!/bin/bash

# MOJI Cache Clearing Script
# Use this when API configurations, dependencies, or build tools change

echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite

echo "🔄 Restarting development server..."
pnpm dev