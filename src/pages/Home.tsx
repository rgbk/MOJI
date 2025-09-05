import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomService } from '../lib/rooms'
import { debugSupabase } from '../lib/debug'
import { uiCopyService } from '../lib/uiCopy'
import DebugOverlay from '../components/DebugOverlay'

function Home() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uiCopyLoaded, setUiCopyLoaded] = useState(false)
  
  useEffect(() => {
    // Ensure UI copy is loaded
    uiCopyService.ensureLoaded().then(() => {
      setUiCopyLoaded(true)
    })
  }, [])

  const handleStartNewGame = async () => {
    try {
      setCreating(true)
      setError(null)
      
      // Debug Supabase connection first
      console.log('🚀 Starting room creation...')
      await debugSupabase()
      
      const room = await roomService.createRoom()
      // Mark this browser as the room creator
      sessionStorage.setItem(`room-creator-${room.id}`, 'true')
      console.log('✅ Room created, marked as creator:', room.id)
      navigate(`/room/${room.id}`)
    } catch (err) {
      console.error('❌ Room creation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create room')
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      {/* Game Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4">
          {uiCopyLoaded ? uiCopyService.getValue('home.title') : 'MOJI!'}
        </h1>
        <p className="text-xl text-gray-400">
          {uiCopyLoaded ? uiCopyService.getValue('home.subtitle') : 'Guess the music from emojis'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-6 max-w-md">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Start Game Button */}
      <button
        onClick={handleStartNewGame}
        disabled={creating}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors duration-200 shadow-lg hover:shadow-purple-500/25"
      >
        {creating ? 'CREATING ROOM...' : (uiCopyLoaded ? uiCopyService.getValue('home.button.start') : 'START NEW GAME')}
      </button>
      
      <DebugOverlay 
        viewName="Home"
        additionalInfo={{
          creating,
          uiCopyLoaded,
          errorState: error ? 'has-error' : 'no-error'
        }}
      />
    </div>
  )
}

export default Home