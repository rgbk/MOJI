# Button Conversion Guide

## Find & Replace Patterns:

### 1. Basic button → Button component
**Find:**
```jsx
<button
  className="bg-purple-600 hover:bg-purple-700..."
  onClick={...}
>
  Text
</button>
```

**Replace with:**
```jsx
<Button
  onClick={...}
  className="custom-purple-gradient" // Keep your colors
>
  Text
</Button>
```

### 2. Disabled buttons
**Find:**
```jsx
disabled:bg-purple-800 disabled:cursor-not-allowed
```

**Replace with:**
```jsx
// Just use disabled={state} - shadcn handles styling
```

### 3. Common button patterns:
- Green buttons → `variant="default"` + green classes
- Red/destructive → `variant="destructive"`
- Secondary → `variant="secondary"`
- Ghost → `variant="ghost"`

## Files to convert (in order):
1. Lobby.tsx - START/ADMIT buttons
2. AnswerInput.tsx - Voice button (keep custom)
3. GameScreen.tsx - READY buttons  
4. Admin.tsx - All admin buttons
5. UICopyTab.tsx - Save/Reset buttons