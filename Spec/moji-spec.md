# **MOJI! - Build Specification for Claude Code**

## **Project Mission**
Build a real-time, two-player music guessing game where players decode emoji puzzles. This is an MVP proof-of-concept with viral potential and music industry monetization opportunities.

---

## **✅ CURRENT IMPLEMENTATION STATUS - Updated August 2025**

### **Completed Features**
- ✅ Basic game structure with routing (`/` → `/game/:id`, `/admin`)
- ✅ Puzzle JSON with 10 music puzzles (local + YouTube video support)
- ✅ Admin interface for CRUD puzzle management
- ✅ Canvas confetti celebrations
- ✅ Video assets directory structure (`/public/videos/`)
- ✅ Puzzle API layer with validation
- ✅ Mobile-first responsive design
- ✅ **Push-to-Talk voice input system** 🎤
- ✅ **Working HTTPS setup for mobile testing** 🔒
- ✅ **Complete voice recognition with transcript display**
- ✅ **Documented reproducible HTTPS testing workflow**

### **Voice Input System (COMPLETED)**
- ✅ Push-to-Talk button with visual feedback
- ✅ Web Speech API integration
- ✅ Transcript display in text input field
- ✅ Mobile microphone permission handling
- ✅ HTTPS secure context for mobile devices
- ✅ Desktop and mobile compatibility tested

### **HTTPS Development Setup (COMPLETED)**
- ✅ Reliable serve + ngrok solution documented
- ✅ Start-https.sh automation script
- ✅ Mobile testing workflow established
- ✅ Bypasses all Vite development server restrictions
- ✅ Ready for multiplayer development

### **Next Phase - Multiplayer Implementation**
- 🔄 Real-time multiplayer via Supabase/WebSockets
- 🔄 Game room creation and joining system
- 🔄 Player synchronization and state management
- 🔄 Real-time scoring and game progression

### **Future Phases**
- ⏳ Tournament system
- ⏳ Social features & sharing
- ⏳ Enhanced admin system with music database integration

---

## **HTTPS Testing Setup (DOCUMENTED)**

### **Quick Start for Mobile Testing**
```bash
# Automated setup
./start-https.sh

# Manual setup (2 terminals)
# Terminal 1:
pnpm build && npx serve -s dist -p 5173 --cors

# Terminal 2:
ngrok http 5173
```

### **Why This Works**
- **serve**: Simple static file server with no host restrictions
- **ngrok**: Provides reliable HTTPS tunneling without certificate management
- **No Vite dev server complications**: Bypasses allowedHosts configuration issues

---

## **Voice Input Implementation (COMPLETED)**

### **Technical Details**
- **Web Speech API**: Browser-native speech recognition
- **Push-to-Talk**: Eliminates false activations and background noise
- **Secure Context**: Requires HTTPS for mobile devices (solved)
- **Cross-platform**: Works on desktop and mobile browsers

### **User Experience**
1. Player holds microphone button
2. Speech recognition starts with visual feedback
3. Player speaks their answer
4. Transcript appears in text input field
5. Player releases button to submit or can edit text first

---

## **Development Workflow**

### **Local Development**
```bash
# For active development with hot reload
pnpm dev

# For mobile HTTPS testing
./start-https.sh
# Then ngrok http 5173 in second terminal
```

### **File Structure Ready for Multiplayer**
```
src/
├── components/
│   ├── VoiceInput.tsx ✅ (Push-to-Talk implemented)
│   ├── GameScreen.tsx
│   ├── PlayerAvatar.tsx
│   └── Timer.tsx
├── lib/
│   ├── speechRecognition.ts ✅ (Voice API wrapper)
│   └── multiplayer/ (ready for implementation)
├── data/
│   └── puzzles.json ✅
└── pages/
    ├── Game.tsx (ready for real-time features)
    └── Admin.tsx ✅
```

---

## **Multiplayer Architecture Planning**

### **Technical Approach Options**
1. **WebSockets** (Socket.io) - Recommended for real-time features
2. **Supabase Real-time** - Managed solution with good React integration
3. **WebRTC** - Direct peer-to-peer (complex but no server costs)

### **Game State Schema (Draft)**
```typescript
interface GameState {
  gameId: string;
  players: {
    player1: Player;
    player2: Player | null;
  };
  currentPuzzleIndex: number;
  puzzleStartTime: number;
  gameStatus: 'waiting' | 'countdown' | 'playing' | 'roundEnd' | 'finished';
  winner: 'player1' | 'player2' | null;
}

interface Player {
  id: string;
  avatar: string;
  score: number;
  ready: boolean;
  connected: boolean;
}
```

### **Real-time Events Needed**
- `player-joined`
- `player-ready`
- `voice-answer-submitted` (integrates with existing voice system)
- `text-answer-submitted`
- `round-complete`
- `game-over`

---

## **Mobile Optimization Completed**

### **Voice Input Mobile Features**
- ✅ Touch-friendly push-to-talk button
- ✅ Proper microphone permission requests
- ✅ HTTPS secure context established
- ✅ Visual feedback for recording state
- ✅ Tested on mobile Safari and Chrome

### **Performance Optimizations**
- ✅ Production build optimization
- ✅ Static file serving for fast loading
- ✅ PWA manifest ready
- ✅ Mobile-first responsive design

---

## **Testing Status**

### **Voice Input Testing ✅**
- [x] Desktop Chrome/Safari voice recognition
- [x] Mobile Safari voice recognition  
- [x] Mobile Chrome voice recognition
- [x] HTTPS secure context on mobile
- [x] Push-to-talk button responsiveness
- [x] Transcript accuracy and display
- [x] Microphone permission flow

### **Development Workflow Testing ✅**
- [x] start-https.sh script functionality
- [x] ngrok tunnel stability
- [x] Mobile device access via ngrok URL
- [x] Production build and serve process
- [x] Cross-platform compatibility

### **Ready for Multiplayer Testing**
- [ ] Real-time game room creation
- [ ] Player joining and ready states
- [ ] Synchronized puzzle display
- [ ] Voice + text answer submission
- [ ] Real-time scoring updates
- [ ] Game completion flow

---

## **Success Metrics Achieved**

### **Phase 1 - Voice Input ✅**
- Voice recognition works reliably on mobile devices
- HTTPS testing setup is reproducible and documented
- Push-to-talk provides good user experience
- System ready for multiplayer integration

### **Phase 2 - Multiplayer (Next)**
- Two players can join same game room
- Voice answers synchronize between players
- Real-time scoring and progression
- Game completion with winner determination

---

## **Implementation Notes**

### **Key Technical Decisions Made**
1. **Push-to-Talk over continuous listening**: Better for multiplayer game environment
2. **serve + ngrok over Vite HTTPS**: More reliable for mobile testing
3. **Web Speech API over third-party**: Native browser support, no API costs
4. **Production build for mobile testing**: Eliminates development server issues

### **Architecture Ready for Scale**
- Voice input system built with multiplayer in mind
- Component structure supports real-time updates
- Game state management prepared for synchronization
- Mobile performance optimized from start

---

## **Next Steps - Multiplayer Development**

### **Immediate Tasks**
1. Choose WebSocket/Supabase approach for real-time communication
2. Implement game room creation and joining system
3. Synchronize game state between players
4. Integrate existing voice input with multiplayer flow
5. Add real-time scoring and winner determination

### **Integration Points**
- Voice input system already captures answers
- HTTPS testing environment ready for multiplayer testing
- Game logic components prepared for real-time updates
- Mobile optimization ensures good multiplayer experience

---

**MILESTONE ACHIEVED: Voice Input + HTTPS Setup Complete ✅**

**READY FOR: Multiplayer Implementation 🚀**

The foundation is solid with working voice recognition and reliable mobile testing. The next phase can focus entirely on real-time multiplayer features without worrying about core input methods or mobile compatibility.