# **MOJI! - Build Specification for Claude Code**

## **Project Mission**
Build a real-time, two-player music guessing game where players decode emoji puzzles. This is an MVP proof-of-concept with viral potential and music industry monetization opportunities.

---

## **Quick Start Setup**

```bash
# Use the existing VibeCodeStack boilerplate at:
# /Users/marckremers/DevZone/experiments/VibeCodeStack

# Install Supabase for real-time
pnpm add @supabase/supabase-js

# Install avatar generator
pnpm add boring-avatars

# Install utilities
pnpm add clsx tailwind-merge
```

---

## **Core Game Mechanics**

### **How It Works**
1. Player 1 creates game → gets shareable URL
2. Player 2 joins via URL → both click "Ready"
3. 3-2-1 countdown → game starts
4. 10 emoji puzzles appear one by one
5. Timer bar burns from both edges toward center (60 seconds per puzzle)
6. First player to guess correctly gets a point
7. First to 6 points wins the game
8. Winner sees music video + Spotify/Apple Music buttons

### **Key Features**
- **Real-time sync** via Supabase
- **No login required** - just share URL
- **Mobile-first** design
- **PWA ready** from boilerplate

---

## **Data Files to Create**

### **src/data/puzzles.json**
```json
{
  "puzzles": [
    {
      "id": 1,
      "type": "artist",
      "emoji": "🔴🔥🌶️",
      "clues": [
        "Rock Band",
        "90s",
        "California"
      ],
      "answers": ["red hot chili peppers", "rhcp", "red hot chilli peppers"],
      "displayAnswer": "Red Hot Chili Peppers",
      "videoUrl": "https://www.youtube.com/embed/YlUKcNNmywk",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/artist/0L8ExT028jH3ddEcZwqJJ5"},
        {"name": "Apple Music", "url": "https://music.apple.com/artist/red-hot-chili-peppers/889780"}
      ]
    },
    {
      "id": 2,
      "type": "song",
      "emoji": "🌊👁️👁️",
      "clues": [
        "Pop",
        "2010s",
        "Teen Artist"
      ],
      "answers": ["ocean eyes", "oceaneyes"],
      "displayAnswer": "Ocean Eyes - Billie Eilish",
      "videoUrl": "https://www.youtube.com/embed/viimfQi_pUw",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/2uIX8YMNjGMD7441kqyyNU"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/ocean-eyes/1440833467"}
      ]
    },
    {
      "id": 3,
      "type": "song",
      "emoji": "🖤🕳️☀️",
      "clues": [
        "Grunge",
        "90s",
        "Seattle"
      ],
      "answers": ["black hole sun", "blackhole sun"],
      "displayAnswer": "Black Hole Sun - Soundgarden",
      "videoUrl": "https://www.youtube.com/embed/3mbBbFH9fAg",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/2EoOZnxNgtmZaD8uUmz2nD"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/black-hole-sun/1440876677"}
      ]
    },
    {
      "id": 4,
      "type": "song",
      "emoji": "👁️🐅",
      "clues": [
        "Rock",
        "80s",
        "Training Montage"
      ],
      "answers": ["eye of the tiger", "eye of tiger"],
      "displayAnswer": "Eye of the Tiger - Survivor",
      "videoUrl": "https://www.youtube.com/embed/btPJPFnesV4",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/2KH16WveTQWT6KOG9Rg6e2"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/eye-of-the-tiger/596473825"}
      ]
    },
    {
      "id": 5,
      "type": "song-artist",
      "emoji": "🔄🌎",
      "clues": [
        "Electronic",
        "90s",
        "French Duo"
      ],
      "answers": ["around the world daft punk", "around the world by daft punk"],
      "displayAnswer": "Around the World - Daft Punk",
      "videoUrl": "https://www.youtube.com/embed/dwDns8x3Jb4",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/1pKYYY0dkg23sQQXi0Q5zN"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/around-the-world/697194953"}
      ]
    },
    {
      "id": 6,
      "type": "artist",
      "emoji": "🦍🦍🦍🦍",
      "clues": [
        "Alternative",
        "2000s",
        "Virtual Band"
      ],
      "answers": ["gorillaz", "the gorillaz"],
      "displayAnswer": "Gorillaz",
      "videoUrl": "https://www.youtube.com/embed/1V_xRb0x9aw",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/artist/3AA28KZvwAUcZuOKwyblJQ"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/artist/gorillaz/567072"}
      ]
    },
    {
      "id": 7,
      "type": "song",
      "emoji": "👀👐🏻🔉",
      "clues": [
        "Grunge",
        "90s",
        "MTV Unplugged"
      ],
      "answers": ["eyes without a face", "eyes without face"],
      "displayAnswer": "Eyes Without a Face - Billy Idol",
      "videoUrl": "https://www.youtube.com/embed/9OFpfTd0EIs",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/5stPKIOGvBPTV5pLqq6268"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/eyes-without-a-face/724454177"}
      ]
    },
    {
      "id": 8,
      "type": "artist",
      "emoji": "🌈",
      "clues": [
        "Rock",
        "70s/80s",
        "British Band"
      ],
      "answers": ["rainbow", "the rainbow"],
      "displayAnswer": "Rainbow",
      "videoUrl": "https://www.youtube.com/embed/p3VgV31vmUE",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/artist/6SLbNPqWoZQkNgYXTpLB4H"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/artist/rainbow/487131"}
      ]
    },
    {
      "id": 9,
      "type": "song",
      "emoji": "💜☔",
      "clues": [
        "Pop/Rock",
        "80s",
        "Minneapolis"
      ],
      "answers": ["purple rain", "purple rain prince"],
      "displayAnswer": "Purple Rain - Prince",
      "videoUrl": "https://www.youtube.com/embed/TvnYmWpD_T8",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/54X78diSLoUDI3joC2bjMz"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/purple-rain/214145442"}
      ]
    },
    {
      "id": 10,
      "type": "song-artist",
      "emoji": "🎰🎸",
      "clues": [
        "Rock",
        "70s",
        "Guitar Solo"
      ],
      "answers": ["money for nothing dire straits", "money for nothing by dire straits"],
      "displayAnswer": "Money for Nothing - Dire Straits",
      "videoUrl": "https://www.youtube.com/embed/wTP2RUD_cL0",
      "links": [
        {"name": "Spotify", "url": "https://open.spotify.com/track/6GnDn5ln0vme3QirUbEJMb"},
        {"name": "Apple Music", "url": "https://music.apple.com/us/song/money-for-nothing/1440772312"}
      ]
    }
  ]
}
```

### **src/data/settings.json**
```json
{
  "game": {
    "roundTimer": 60,
    "puzzlesPerGame": 10,
    "winCondition": 6,
    "countdownDuration": 3
  },
  "ui": {
    "timerBarColor": "#FFD700",
    "timerBarBg": "#333333",
    "backgroundColor": "#0F0F0F",
    "correctColor": "#00FF00",
    "wrongColor": "#FF0000"
  },
  "text": {
    "endGameWin": "{winner} WINS!",
    "endGameButtons": ["Play Again", "Share Victory"],
    "waitingForPlayer": "Waiting for opponent...",
    "readyPrompt": "Click READY when prepared to battle!"
  }
}
```

---

## **Component Structure**

### **src/App.tsx**
```typescript
// Main router - handles / and /game/:gameId routes
// If no gameId, create new game and redirect to /game/[newId]
```

### **src/pages/Game.tsx**
```typescript
// Main game container
// Manages Supabase connection and game state
// Renders GameScreen or WaitingRoom based on player status
```

### **src/components/GameScreen.tsx**
```typescript
// Active game UI
// Contains: Timer, PlayerAvatars, EmojiPuzzle, AnswerInput
```

### **src/components/Timer.tsx**
```typescript
// Street Fighter style burning bar
// Visual: ═══════[⏱60s]═══════
// Burns from both edges toward center
// Changes color when < 10 seconds
```

### **src/components/EmojiPuzzle.tsx**
```typescript
// Displays current emoji puzzle
// Shows puzzle type (SONG/ARTIST/SONG+ARTIST)
// Shake animation on wrong answer
// Slides up on correct answer
```

### **src/components/AnswerInput.tsx**
```typescript
// Always visible text input
// CLUE button (shows number of clues used)
// Future: Microphone button (placeholder for v2)
```

### **src/components/PlayerAvatar.tsx**
```typescript
// Uses boring-avatars library
// Shows score below avatar
// Pulse animation when player scores
```

### **src/components/WinnerScreen.tsx**
```typescript
// Full-screen video background
// Shows final answer
// Spotify/Apple Music buttons overlay
// Transitions to next puzzle or final results
```

---

## **Supabase Setup**

### **Game State Schema**
```typescript
interface GameState {
  gameId: string;
  players: {
    player1: {
      id: string;
      avatar: string;
      score: number;
      ready: boolean;
      connected: boolean;
    };
    player2: {
      id: string;
      avatar: string;
      score: number;
      ready: boolean;
      connected: boolean;
    } | null;
  };
  currentPuzzleIndex: number;
  puzzleStartTime: number;
  clueRequests: {
    player1: boolean;
    player2: boolean;
    currentClueLevel: 0 | 1 | 2 | 3;
  };
  gameStatus: 'waiting' | 'countdown' | 'playing' | 'roundEnd' | 'finished';
  winner: 'player1' | 'player2' | null;
}
```

### **Real-time Events**
```typescript
// Events to listen for:
- 'player-joined'
- 'player-ready'
- 'answer-submitted'
- 'clue-requested'
- 'round-complete'
- 'game-over'
```

---

## **UI Layout**

### **Desktop/Tablet**
```
┌─────────────────────────────────────────┐
│ [Avatar] 3  ═══════[60s]═══════  2 [Avatar] │
│                                         │
│              🔴 🔥 🌶️                  │
│            [Type: ARTIST]               │
│                                         │
│     [🎤] [_____________] [CLUE (0)]    │
└─────────────────────────────────────────┘
```

### **Mobile (Portrait)**
```
┌──────────────┐
│ [P1] 3  2 [P2] │
│ ═════[60]═════│
│               │
│   🔴 🔥 🌶️    │
│   [ARTIST]    │
│               │
│ [___________] │
│ [🎤] [CLUE]   │
└──────────────┘
```

---

## **Game Logic Implementation**

### **Answer Checking**
```javascript
function checkAnswer(input, correctAnswers) {
  const normalized = input.toLowerCase().trim();
  return correctAnswers.some(answer => 
    normalized === answer.toLowerCase()
  );
}
```

### **Clue System**
```javascript
// Both players must request clue
// Neither knows if other requested
// If both request within same puzzle, reveal next clue level
// Max 3 clues per puzzle
```

### **Timer Sync**
```javascript
// Server timestamp when puzzle starts
// Both clients calculate remaining time from server timestamp
// No client-side authority over timer
```

---

## **Styling Guide**

### **Colors (Tailwind)**
```css
/* Background */
bg-gray-900 (main)
bg-black (video overlay)

/* Timer Bar */
bg-yellow-400 (active timer)
bg-red-500 (< 10 seconds)
bg-gray-700 (depleted)

/* Feedback */
text-green-400 (correct)
text-red-400 (wrong)

/* Buttons */
bg-blue-600 hover:bg-blue-700 (primary)
bg-gray-600 hover:bg-gray-700 (secondary)
```

---

## **Implementation Steps**

### **Phase 1: Setup**
1. Copy VibeCodeStack to new project folder
2. Install dependencies (Supabase, boring-avatars)
3. Create data files (puzzles.json, settings.json)
4. Setup basic routing (/, /game/:id)

### **Phase 2: Core UI**
1. Build GameScreen layout
2. Create Timer component with burning animation
3. Add PlayerAvatar components
4. Build EmojiPuzzle display
5. Create AnswerInput component

### **Phase 3: Game Logic**
1. Implement game state management
2. Add puzzle rotation logic
3. Build answer checking
4. Add score tracking
5. Implement clue system

### **Phase 4: Real-time**
1. Setup Supabase project
2. Implement room creation/joining
3. Add state synchronization
4. Handle player disconnections (placeholder)

### **Phase 5: Polish**
1. Add countdown animation
2. Implement winner screen
3. Add shake animation for wrong answers
4. Test on mobile devices
5. Deploy to GitHub Pages

---

## **Placeholder Features (Don't Implement Yet)**

```typescript
// Voice input - Phase 2
const handleVoiceInput = () => {
  console.log("Voice input coming in v2");
  // Will use Web Speech API
};

// Disconnect handling - Phase 2
const handleDisconnect = () => {
  console.log("Player disconnected - reconnection coming in v2");
  // Will implement 30-second timeout
};

// Random matchmaking - Phase 3
const findRandomOpponent = () => {
  console.log("Random matchmaking coming in v3");
  // Will use Supabase presence
};
```

---

## **Testing Checklist**
- [ ] Game creates and shares URL correctly
- [ ] Both players can join and ready up
- [ ] Timer syncs between players
- [ ] Correct answers register for right player
- [ ] Score updates properly
- [ ] Game ends at 6 points
- [ ] Works on mobile Safari/Chrome
- [ ] PWA installs correctly

---

## **Deployment**

```bash
# Build
pnpm build

# Deploy to GitHub Pages
# Setup GitHub Actions for auto-deploy

# Configure custom domain
# Add CNAME file with: moji.apps.futurecorp.paris
```

---

## **Success Metrics**
- Players can complete a full game without errors
- Game feels responsive (< 100ms for actions)
- Works on both players' phones simultaneously
- Timer stays synchronized
- Fun factor: Would Marc's brother in Antwerp play again?

---

## **Notes for Claude Code**

### **Important Context**
- This is Marc's MVP proof-of-concept for a potentially viral music game
- Focus on mobile experience - both players will likely be on phones
- The Street Fighter timer visual is KEY to the experience
- Supabase free tier is fine for testing (500 concurrent connections)
- Voice input is Phase 2 - just add a placeholder button for now

### **Start Simple**
1. First get the UI looking good with static data
2. Then add local game logic
3. Finally add Supabase for real-time multiplayer

### **Key Files Already Exist**
The VibeCodeStack boilerplate at `/Users/marckremers/DevZone/experiments/VibeCodeStack` includes:
- Vite + React + TypeScript setup
- Tailwind CSS configured
- PWA manifest ready
- All build tools configured

---

## **Mobile Development & Testing Setup**

### **Local Phone Testing**
```bash
# Configure vite.config.ts for network access:
export default {
  server: {
    host: true,  // This exposes to local network
    port: 5173,
    strictPort: true
  }
}

# Find your Mac's IP:
# System Preferences → Network → Your IP

# Access from phone:
# http://192.168.X.X:5173
```

### **Quick Testing Scripts**
```json
// Add to package.json
{
  "scripts": {
    "dev": "vite",
    "dev:mobile": "vite --host",
    "dev:mock": "VITE_MODE=mock vite --host",  // No Supabase needed
    "dev:fast": "VITE_MODE=fast vite --host",   // 10s timers, 3 puzzles
    "dev:tunnel": "npx ngrok http 5173",        // Public URL for remote testing
    "build:preview": "vite build && vite preview --host"
  }
}
```

---

## **Feature Flags for Rapid Testing**

### **src/data/features.json**
```json
{
  "development": {
    "skipCountdown": false,     // Skip 3-2-1, jump to game
    "shortTimer": false,        // 10 seconds instead of 60
    "showAnswers": false,       // Shows answer in console
    "singlePlayer": false,      // Play alone without waiting
    "autoWin": false,          // Auto-complete after 5 seconds
    "infiniteGame": false,      // No win condition
    "debugPanel": true,         // Show debug info overlay
    "mockSupabase": false      // Use local state only
  }
}
```

---

## **Mobile-Specific Requirements**

### **Critical Mobile Constraints**
```css
/* Minimum touch targets */
.button { min-height: 44px; min-width: 44px; }

/* Prevent iOS bouncing */
body { overscroll-behavior: none; }

/* Handle notch */
.game-screen { 
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Keyboard handling */
.answer-input:focus {
  position: fixed;
  bottom: 0;
  transform: translateY(-100%);
}
```

### **Required Meta Tags**
```html
<!-- Prevent zoom and ensure proper mobile rendering -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
```

---

## **Debug Mode for Mobile Testing**

### **src/components/DebugPanel.tsx**
```typescript
// Floating debug panel (only in dev)
// Shows:
- Game state (waiting/playing/finished)
- Current puzzle answer
- Network latency to Supabase
- Screen size & orientation
- FPS counter
- Touch coordinates
- Console logs (last 5)
```

---

## **Error Handling & Fallbacks**

### **Network Resilience**
```typescript
const connectionHandlers = {
  onDisconnect: () => {
    // Show "Connection lost..." message
    // Attempt reconnect every 3 seconds
    // Cache game state locally
  },
  onReconnect: () => {
    // Sync state with server
    // Resume game if possible
  },
  onTimeout: () => {
    // After 30s, offer single-player mode
  }
}
```

### **Asset Fallbacks**
```typescript
// If video fails to load:
videoElement.onerror = () => {
  // Show album art instead
  // Still play audio if available
}

// If Spotify/Apple Music links fail:
// Show YouTube search as fallback
```

---

## **Iteration Tracking**

### **Version Management**
```typescript
// src/config/version.ts
export const VERSION = {
  number: "0.1.0",
  features: {
    multiplayer: true,
    voice: false,  // Ready but disabled
    tournaments: false,  // Structure ready
    social: false  // Buttons ready, auth not connected
  }
}
```

### **A/B Testing Structure**
```typescript
// Ready for future experiments
interface Experiment {
  timerStyle: 'bar' | 'circular'
  inputMethod: 'text' | 'scrambled'
  clueStyle: 'progressive' | 'all-at-once'
}
```

---

## **Performance Monitoring**

### **Key Metrics to Track**
```typescript
// Built-in but not sent anywhere yet
const metrics = {
  timeToFirstInteraction: 0,
  averageResponseTime: 0,
  droppedFrames: 0,
  networkLatency: 0,
  batteryUsage: navigator.getBattery()
}
```

---

## **Progressive Enhancement Path**

```markdown
## Code Structure Ready For:

### v0.2 - Voice Input
- Button already in UI (disabled)
- Handler function stubbed
- Web Speech API integration point ready

### v0.3 - Social Login  
- Spotify/Apple buttons exist
- Auth flow structure in place
- Just needs API keys

### v0.4 - Daily Challenges
- Puzzle structure supports date-based selection
- Leaderboard component stubbed

### v0.5 - Tournaments
- Room system can handle multiple players
- Bracket visualization component ready

### v1.0 - Native App
- PWA manifest complete
- Capacitor config ready
- Push notification hooks in place
```

---

## **Testing Checklist for Marc**

### **Before Sharing with Brother:**
- [ ] Test on YOUR phone first
- [ ] Check both portrait and landscape
- [ ] Test with WiFi AND 4G
- [ ] Verify keyboard doesn't cover input
- [ ] Test clue system works
- [ ] Ensure timer syncs properly
- [ ] Try disconnecting/reconnecting
- [ ] Test with phone on silent
- [ ] Check works in Safari AND Chrome
- [ ] Test with low battery mode on

---

## **Quick Commands for Common Tasks**

```bash
# Start dev with mobile access
pnpm dev:mobile

# See console output on phone
# Add ?debug=true to URL

# Test without waiting for player 2
# Add ?solo=true to URL

# Skip to specific puzzle
# Add ?puzzle=5 to URL

# Use short timers for quick testing
# Add ?fast=true to URL
```

---

**READY TO BUILD! 🚀 Let's make MOJI! happen!**

**PRO TIP:** Start Claude Code with: "Build MOJI! as a mobile-first PWA. I'll be testing on iPhone while developing on desktop. Start with Phase 1-2 (UI only), use mock data first, then add real-time in Phase 3."