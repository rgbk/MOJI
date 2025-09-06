# UI Copy Audit Report

## 📊 Used Keys in Code (27 total)

These are ALL the UI copy keys currently used in the codebase:

```
answer.correct.opponent
answer.correct.you  
answer.label
answer.next.multi
answer.next.single
answer.waiting
game.error.reload
game.error.title
game.input.placeholder
game.player.opponent
game.player.you
game.room.label
game.waiting
home.button.start
home.subtitle
home.title
lobby.copied
lobby.copied.help
lobby.copy
lobby.join.alert
lobby.join.button
lobby.join.help
lobby.ready
lobby.share
lobby.start
lobby.title
lobby.waiting.host
```

## 🔍 Database Keys From Your List

You mentioned these keys exist in the database:

```
Home
button.admin  ❌ UNUSED
button.join   ❌ UNUSED  
button.start  ✅ USED (as home.button.start)
subtitle      ✅ USED (as home.subtitle)
title         ✅ USED (as home.title)
```

## ⚠️ Issues Found

### Unused Keys (Remove These):
- `home.button.admin` - No admin button on home page
- `home.button.join` - No join button on home page

### Missing Keys (Add These):
Based on the code, these keys are needed but might be missing:

**Answer Section:**
- `answer.correct.opponent`
- `answer.correct.you`
- `answer.label`
- `answer.next.multi`
- `answer.next.single`
- `answer.waiting`

**Game Section:**
- `game.error.reload`
- `game.error.title`
- `game.input.placeholder`
- `game.player.opponent`
- `game.player.you`
- `game.room.label`
- `game.waiting`

**Lobby Section:**
- `lobby.copied`
- `lobby.copied.help`
- `lobby.copy`
- `lobby.join.alert`
- `lobby.join.button`
- `lobby.join.help`
- `lobby.ready`
- `lobby.share`
- `lobby.start`
- `lobby.title`
- `lobby.waiting.host`

## 🎯 Action Plan

### Step 1: Check Database
Go to Admin → UI Copy tab and verify which keys actually exist.

### Step 2: Clean Unused
Remove unused keys:
- `home.button.admin`
- `home.button.join`

### Step 3: Add Missing
Add any missing keys from the "Used Keys" list above.

## 🤖 Quick Database Query

To see all current keys in your database, run this in Admin:

```sql
SELECT category, key, value FROM ui_copy ORDER BY category, key;
```

This will show you exactly what's in the database vs what the code expects.