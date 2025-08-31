#!/bin/bash
echo "Starting MOJI HTTPS setup"
pnpm build
npx serve -s dist -p 5173 --cors
