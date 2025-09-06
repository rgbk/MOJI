# 🎮 MOJI! - Real-time Multiplayer Music Guessing Game

> A fun, fast-paced multiplayer game where players guess songs from emoji clues using voice or text input.

## ✨ Features

- 🎵 **Music Guessing** - Guess songs from emoji clues
- 🎙️ **Voice Input** - Use speech recognition for answers (Chrome/Edge)
- 👥 **Real-time Multiplayer** - Play with friends in real-time
- 📱 **Progressive Web App** - Install on mobile devices
- 🏆 **Competitive Scoring** - Speed and accuracy matter
- 🎨 **Beautiful UI** - Dark theme with smooth animations

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# For mobile testing with Cloudflare tunnel
cloudflared tunnel --url http://localhost:5173
```

## 📱 Browser Compatibility

| Browser | Desktop | Mobile | Voice Input | Notes |
|---------|---------|---------|-------------|-------|
| Chrome | ✅ Full Support | ✅ Full Support | ✅ Works | Best experience |
| Edge | ✅ Full Support | ✅ Full Support | ✅ Works | Same as Chrome |
| Firefox | ✅ Full Support | ✅ Full Support | ❌ Not Supported | Text input only |
| Safari | ✅ Full Support | ⚠️ Limited | ❌ Not Working | Voice recognition issues on mobile/PWA |

### ⚠️ Safari Mobile Limitations

**Current Issue**: Web Speech API doesn't work reliably on Safari mobile, especially in:
- Private/Incognito mode
- PWA (installed app) mode
- Cross-page navigation scenarios

**Workaround**: Safari mobile users should use text input for now.

**Future Solution**: Planning to implement cloud-based speech recognition (Deepgram/Whisper API) for full Safari support.

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Voice**: Web Speech API (Chrome/Edge)
- **Hosting**: Vercel/Netlify ready
- **PWA**: Service workers + manifest

## 📝 Available Scripts

```bash
pnpm dev             # Start dev server
pnpm build           # Production build
pnpm preview         # Preview production build
pnpm lint            # Check code quality
pnpm type-check      # TypeScript type checking
```

## 🎮 How to Play

1. **Create or Join Room**: Start a new game or join with a room code
2. **Test Microphone**: Enable mic permissions in the lobby (Chrome/Edge only)
3. **Guess the Song**: See emoji clues and speak or type your answer
4. **Score Points**: Faster correct answers = more points
5. **Win**: Player with most points after all puzzles wins!

## 🔧 Development

### Environment Variables

Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Mobile Testing

For testing on mobile devices:
```bash
# Using Cloudflare tunnel (recommended)
cloudflared tunnel --url http://localhost:5173

# Or using ngrok
ngrok http 5173
```

## 📊 Project Status

- ✅ Core game mechanics working
- ✅ Multiplayer synchronization
- ✅ Voice input (Chrome/Edge)
- ✅ PWA installation
- ⚠️ Safari mobile voice support (planned)
- 🚧 Leaderboards (coming soon)
- 🚧 Custom puzzle packs (coming soon)

## 🤝 Contributing

Contributions welcome! Please test on multiple browsers before submitting PRs.

## 📄 License

MIT

---

Built with ❤️ using React, TypeScript, and Supabase