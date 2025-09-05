# Claude AI Assistant Guidelines for MOJI Project

## CRITICAL: Check for Existing Solutions First! 🚨

**BEFORE writing custom code, ALWAYS:**
1. **Search npm/GitHub** for proven libraries that solve the problem
2. **Use battle-tested solutions** that thousands of developers already use
3. **Don't reinvent the wheel** - especially for complex browser APIs like:
   - Voice recognition / Web Speech API
   - WebRTC / Media streams  
   - Cross-browser compatibility issues
   - Safari-specific quirks
   - Permissions handling

**Why this matters:**
- Open source libraries have solved edge cases we haven't thought of
- They're tested across thousands of devices and browsers
- They handle Safari/iOS quirks that would take us hours to discover
- Better UX - no janky workarounds or "just ask twice" solutions

**Examples of when to use libraries:**
- Voice recognition: Use `react-speech-recognition` or `annyang` instead of raw Web Speech API
- Media permissions: Use `react-use` hooks or `navigator-permissions`
- Cross-browser audio: Use `howler.js` or `tone.js`
- Real-time sync: Use `yjs` or `socket.io` patterns

**Remember:** Great games use great tools. Don't waste time on problems that were solved in 2015!

## Critical Mobile Testing Setup Protocol 🚨

**IMPORTANT: User has FREE ngrok account = ONLY 1 tunnel allowed at a time**

### ngrok Setup Steps (DO NOT FORGET):
1. **ALWAYS kill existing ngrok first**: `pkill -f ngrok`
2. **Start new tunnel**: `ngrok http 5173`
3. **Get new URL**: `curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4`
4. **Update vite.config.ts** with the NEW ngrok URL in allowedHosts array
5. **Restart dev server** to pick up new config

### Why This Is Critical:
- User always tests on iPhone via ngrok
- Free account = 1 tunnel limit
- Forgetting to kill/update causes connection failures
- This mistake happens EVERY time - document it!

## Development Commands

### Mobile Testing Flow:
```bash
# 1. Kill any existing ngrok
pkill -f ngrok

# 2. Start fresh tunnel  
ngrok http 5173

# 3. Get URL and update vite.config.ts
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4

# 4. Update allowedHosts in vite.config.ts with new URL
# 5. Restart dev server
```

### Cache Clearing:
```bash
rm -rf node_modules/.vite && rm -rf dist
pnpm run dev
```

## Project Context
- Real-time multiplayer music guessing game
- React + TypeScript + Vite
- Supabase backend with real-time subscriptions
- Voice input with Web Speech API
- Progressive Web App (PWA)
- Safari compatibility is critical