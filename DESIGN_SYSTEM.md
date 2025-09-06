# MOJI Design System & Page States

## 📱 Page Architecture & States

### 1. Home Page
**Route:** `/`
**Component:** `Home.tsx`
**States:**
- `home-default` - Landing page with START NEW GAME button

### 2. Lobby System
**Route:** `/room/{roomId}`
**Component:** `Lobby.tsx`

#### Player 1 (Creator) States:
- `lobby-p1-waiting-player2` - Creator alone, sharing link
- `lobby-p1-pending-admit` - Player 2 wants to join, ADMIT button visible
- `lobby-p1-ready-start` - Both players present, START GAME button active
- `lobby-p1-mic-setup` - Microphone permission setup flow

#### Player 2 (Joiner) States:
- `lobby-p2-requesting-entry` - Waiting for Player 1 approval
- `lobby-p2-admitted` - Accepted, waiting for game start
- `lobby-p2-mic-setup` - Microphone permission setup flow
- `lobby-p2-rejected` - Entry denied (edge case)

### 3. Game Flow
**Route:** `/game/{gameId}`
**Component:** `Game.tsx`

#### Pre-Round States:
- `game-countdown` - 3-2-1 countdown before puzzle
- `game-loading-puzzle` - Loading next puzzle assets

#### Active Round States:
- `game-puzzle-active` - Both players can answer
- `game-puzzle-answered-p1` - Player 1 answered, waiting for P2
- `game-puzzle-answered-p2` - Player 2 answered, waiting for P1
- `game-puzzle-timeout` - Timer expired, no answers

#### Post-Round States:
- `game-answer-reveal` - Showing correct answer + video
- `game-round-winner-p1` - Player 1 won this round
- `game-round-winner-p2` - Player 2 won this round
- `game-round-tie` - Both players got it right/wrong
- `game-waiting-ready-p1` - P1 needs to click READY for next round
- `game-waiting-ready-p2` - P2 needs to click READY for next round
- `game-waiting-ready-both` - Both need to click READY

#### Game End States:
- `game-winner-p1` - Player 1 wins overall game
- `game-winner-p2` - Player 2 wins overall game  
- `game-winner-tie` - Final game tied
- `game-complete-lobby` - Option to return to lobby/new game

### 4. Admin Panel
**Route:** `/admin`
**Component:** `AdminPanel.tsx`
**States:**
- `admin-dashboard` - Main admin interface
- `admin-puzzle-editor` - Editing individual puzzles
- `admin-settings` - Game configuration

---

## 🎨 Component States & Design Tokens

### Voice Button Component
**Component:** `AnswerInput.tsx` → Button states

```css
/* Design Tokens */
:root {
  /* Button Colors */
  --voice-ready: #3B82F6;      /* Blue-600 */
  --voice-ready-hover: #2563EB; /* Blue-700 */
  --voice-starting: #F59E0B;    /* Amber-500 */
  --voice-recording: #10B981;   /* Emerald-500 */
  --voice-error: #EF4444;       /* Red-500 */
  --voice-disabled: #6B7280;    /* Gray-500 */
  
  /* Button Sizes */
  --voice-button-padding: 1.5rem 2rem; /* px-6 py-3 */
  --voice-button-radius: 9999px;       /* rounded-full */
  
  /* Animations */
  --pulse-duration: 2s;
  --transition-duration: 200ms;
}
```

#### Voice Button States:
1. **`voice-ready`** (Default)
   - Color: `bg-blue-600 hover:bg-blue-700`
   - Text: "🎤 READY"
   - Icon: MicrophoneIcon

2. **`voice-starting`** (Initializing)
   - Color: `bg-amber-500`
   - Text: "STARTING..."  
   - Icon: Spinner animation
   - Scale: `scale-110`

3. **`voice-recording`** (Active)
   - Color: `bg-emerald-500 hover:bg-emerald-600`
   - Text: "● STOP"
   - Icon: Pulsing white dot
   - Animation: `animate-pulse`
   - Scale: `scale-110`
   - Shadow: `shadow-lg shadow-emerald-500/50`

4. **`voice-error-permission`** (Denied)
   - Color: `bg-yellow-600 hover:bg-yellow-700`
   - Text: "⚠️ ALLOW MIC"
   - State: Clickable to retry

5. **`voice-error-unsupported`** (Not supported)
   - Color: `bg-gray-600`
   - Text: "❌ NOT SUPPORTED"
   - State: Disabled

### Microphone Setup Component
**Component:** `MicrophoneSetup.tsx`

#### States:
1. **`mic-setup-prompt`** - Initial setup request
2. **`mic-setup-requesting`** - Permission dialog open
3. **`mic-setup-granted`** - Permission successful
4. **`mic-setup-denied`** - Permission failed
5. **`mic-setup-compact-ready`** - Small success indicator

---

## 🎯 State Naming Convention

### Pattern: `{page}-{player?}-{state}-{substatus?}`

**Examples:**
- `lobby-p1-waiting-player2` 
- `lobby-p2-mic-setup`
- `game-puzzle-answered-p1`
- `game-waiting-ready-both`
- `voice-recording`

### Player Indicators:
- `p1` = Player 1 (Creator)
- `p2` = Player 2 (Joiner)
- `both` = Both players affected

### Common State Types:
- `waiting` = Passive waiting state
- `active` = Interactive/actionable state  
- `setup` = Configuration/permission flow
- `error` = Error/failure state
- `success` = Completion/success state

---

## 📋 Figma Page Structure

```
MOJI Game Screens/
├── 01-Home/
│   └── home-default
├── 02-Lobby/
│   ├── Player 1 States/
│   │   ├── lobby-p1-waiting-player2
│   │   ├── lobby-p1-pending-admit  
│   │   ├── lobby-p1-ready-start
│   │   └── lobby-p1-mic-setup
│   └── Player 2 States/
│       ├── lobby-p2-requesting-entry
│       ├── lobby-p2-admitted
│       └── lobby-p2-mic-setup
├── 03-Game-Flow/
│   ├── Pre-Round/
│   │   ├── game-countdown
│   │   └── game-loading-puzzle
│   ├── Active-Round/
│   │   ├── game-puzzle-active
│   │   ├── game-puzzle-answered-p1
│   │   └── game-puzzle-answered-p2
│   └── Post-Round/
│       ├── game-answer-reveal
│       ├── game-round-winner-p1
│       ├── game-round-winner-p2
│       ├── game-waiting-ready-p1
│       └── game-waiting-ready-both
├── 04-Components/
│   ├── Voice-Button-States/
│   │   ├── voice-ready
│   │   ├── voice-starting  
│   │   ├── voice-recording
│   │   ├── voice-error-permission
│   │   └── voice-error-unsupported
│   └── Microphone-Setup/
│       ├── mic-setup-prompt
│       ├── mic-setup-granted
│       └── mic-setup-denied
└── 05-Design-Tokens/
    ├── Colors
    ├── Typography
    ├── Spacing
    └── Animations
```

---

## 🚀 Implementation Notes

### State Management:
- Each state corresponds to specific React component props/state combinations
- Use TypeScript unions for type safety: `type LobbyState = 'lobby-p1-waiting-player2' | 'lobby-p1-pending-admit' | ...`

### CSS Classes:
- Map Figma state names to Tailwind utility classes
- Use CSS custom properties for design tokens
- Maintain 1:1 mapping between Figma components and React components

### Animation Timing:
- Transitions: `duration-200` (200ms)
- Pulse animations: `animate-pulse` (2s cycle)
- Scale transforms: `scale-110` for active states

**This gives you a complete design system that maps perfectly from Figma to code!** 🎨