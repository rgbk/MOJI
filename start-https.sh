#!/bin/bash
echo "Starting MOJI HTTPS setup"
pnpm build
echo "Starting server (ngrok bypass via URL parameter)..."
npx serve -s dist -p 5173 --cors
