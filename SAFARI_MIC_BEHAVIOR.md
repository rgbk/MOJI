# Safari Microphone Permission Behavior Analysis

## 🦁 Safari vs Chrome Differences

### Chrome Behavior:
- ✅ Permissions persist across browser sessions
- ✅ Once granted, rarely asks again for same domain
- ✅ More permissive with permission inheritance

### Safari Behavior:
- ⚠️ **More restrictive permission model**
- ⚠️ Permissions may not persist across tabs/windows
- ⚠️ Each "room" or page navigation can trigger new permission request
- ⚠️ More aggressive permission clearing

## 🔍 Root Causes in MOJI App

### Why Safari asks every room:
1. **Page Navigation**: Each room navigation (`/room/ABC123`) might be treated as a new context
2. **Session Storage**: Safari might not persist Web Speech API permissions like Chrome
3. **getUserMedia vs SpeechRecognition**: Different permission models
4. **Secure Context**: More strict HTTPS requirements

### Current Flow Issues:
1. User creates room → no mic permission yet
2. User joins game → first voice attempt triggers permission
3. Safari treats this as "new context" each time

## 🚀 Solutions Implemented

### 1. Proactive Permission Request in Lobby ✅
- `MicrophoneSetup` component requests permission before game starts
- Uses `requestPermission()` which calls `getUserMedia()` first
- This should "warm up" the permissions for Safari

### 2. Early Permission Persistence
- Request permission as early as possible
- Store permission state in React state and localStorage
- Check permission status on every page load

### 3. Safari-Specific Handling
- Use `navigator.permissions.query()` to check current state
- Handle Safari's stricter permission model gracefully
- Provide clear user feedback

## 🧪 Testing Strategy

### Test Cases:
1. **Fresh Safari session** → Enable mic in lobby → Play game
2. **New room in same session** → Should mic permission persist?
3. **New tab/window** → Does permission carry over?
4. **After browser restart** → Expected to need re-permission

### Expected Results:
- ✅ Lobby mic setup should reduce in-game permission prompts
- ✅ Better UX with proactive permission handling
- ⚠️ May still need permission after browser restarts (Safari normal behavior)