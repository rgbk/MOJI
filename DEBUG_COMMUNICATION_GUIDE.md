# 🐛 Debug Communication Guide for MOJI Multiplayer

## 📋 **Enhanced Debug Overlay States**

### **New Features (Latest Session):**
- **🏠 Home Button**: Quick navigation button above debug overlay for faster testing iterations
- **🎤 Microphone Debug Integration**: Real-time microphone permission state in debug overlay
- **🔧 Room-Specific Permission Persistence**: Fixed permission contamination between players using room-specific sessionStorage

### **Lobby States (Player 1 Perspective):**
- `Lobby-Player1-WaitingForPlayer2` - Solo in lobby, need 2nd player
- `Lobby-Player1-AdmitPlayer2` - Player 2 joined, needs approval
- `Lobby-Player1-ReadyToStart` - Both players ready, can start game

### **Lobby States (Player 2 Perspective):**
- `Lobby-Player2-WaitingForApproval` - Joined room, waiting for Player 1 approval

### **Other States:**
- `Home` - Landing page
- `Game` - In active gameplay
- `Admin` - Admin panel
- `Lobby-Loading` - Loading room data

## 🎯 **Communication Protocol for Bug Reports**

### **Step 1: Capture State**
1. Click debug overlay to expand
2. Click "📋 Copy" button
3. Paste state into chat/issue

### **Step 2: Describe Issue**
```
🐛 Issue: [Brief description]
📱 Device: iPhone/Desktop Safari/Chrome
🎮 Player: Player 1 / Player 2
⏰ When: [What action triggered it]

[Paste debug state here]
```

### **Example Bug Report:**
```
🐛 Issue: Player 2 not seeing Player 1's ready state
📱 Device: iPhone Safari
🎮 Player: Player 2
⏰ When: After Player 1 clicked "Start Game"

🐛 Debug State: Lobby-Player2-WaitingForApproval
view: Lobby-Player2-WaitingForApproval
path: /room/ABC123
roomId: ABC123
isCreator: false
playersCount: 2
loading: false
error: none
players: [{"name":"Player 1","isCreator":true,"approved":true},{"name":"Player 2","isCreator":false,"approved":false}]
```

## 🔄 **Real-time Sync Debugging**

### **Key Fields to Watch:**
- **`playersCount`** - Should match between players
- **`pendingPlayer`** - Should show when Player 2 joins
- **`isCreator`** - Player 1 = true, Player 2 = false
- **`players` array** - Shows approval status for each player
- **`sessionStorage.roomCreator`** - Should be 'true' for Player 1, 'false' for Player 2

### **Common Issues to Look For:**
1. **Desync**: Different `playersCount` between Player 1 & 2
2. **Permission Issues**: `approved: false` stuck for Player 2  
3. **Identity Confusion**: Wrong `isCreator` values
4. **Session Problems**: Incorrect `sessionStorage.roomCreator`

## 📞 **Quick Communication Shortcuts**

### **State Sharing:**
Instead of describing: *"I'm in the lobby waiting for the other player"*
Just copy and share: `Lobby-Player1-WaitingForPlayer2`

### **Issue Reproduction:**
1. Both players copy their debug states
2. Compare the key differences
3. Focus on fields that should match but don't

## 🚀 **Additional Debug Suggestions**

### **Real-time Subscription Status** (Future Enhancement)
- Show if Supabase subscription is active
- Display last received real-time event
- Show WebSocket connection status

### **Network Status** (Future Enhancement)
- Connection quality indicator
- Last server ping time
- Failed request counter

### **Game State Sync** (Future Enhancement)  
- Current puzzle index sync status
- Timer synchronization status
- Score consistency check

This debug overlay should make our communication much more precise and help identify exactly where the multiplayer sync issues are occurring!