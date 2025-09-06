import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomService, type GameRoom, type RoomPlayer } from '../lib/rooms'
import { supabase } from '../lib/supabase'
import { puzzleService } from '../lib/puzzles'
import { settingsService } from '../lib/settings'
import { uiCopyService } from '../lib/uiCopy'
import MicrophoneSetup from '../components/MicrophoneSetup'
import DebugOverlay from '../components/DebugOverlay'
import { Button } from '../components/ui/button'

function Lobby() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [pendingPlayer, setPendingPlayer] = useState<RoomPlayer | null>(null)
  const [copied, setCopied] = useState(false)
  const [microphoneDebugInfo, setMicrophoneDebugInfo] = useState<any>(null)
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false)

  useEffect(() => {
    if (!roomId) {
      setError('Invalid room ID')
      setLoading(false)
      return
    }

    loadRoomData()

    // Set up realtime subscription for room_players changes
    const subscription = supabase
      .channel(`room_players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('🔄 Realtime player update:', payload)
          // Reload players when changes occur
          loadRoomData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  // Handle automatic navigation for approved Player 2
  useEffect(() => {
    const myPlayer = players.find(p => !p.is_creator)
    if (myPlayer?.approved && !isCreator) {
      // Navigate after a short delay to ensure state is stable
      const timer = setTimeout(() => {
        console.log('🦁 Safari Navigation Debug: Lobby → Game', { 
          roomId, 
          sessionKey: `moji-mic-permission-${roomId}`,
          sessionValue: sessionStorage.getItem(`moji-mic-permission-${roomId}`)
        })
        navigate(`/game/${roomId}`)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [players, isCreator, navigate, roomId])

  const loadRoomData = async () => {
    try {
      setLoading(true)
      setError(null)

      const roomData = await roomService.getRoomById(roomId!)
      if (!roomData) {
        setError('Room not found')
        return
      }

      let playersData = await roomService.getRoomPlayers(roomId!)
      
      // Check if I created this room
      const amICreator = sessionStorage.getItem(`room-creator-${roomId}`) === 'true'
      
      // Only join as Player 2 if I didn't create this room and haven't already joined
      const hasPlayerTwo = playersData.some(p => !p.is_creator)
      const shouldJoinAsPlayerTwo = playersData.length === 1 && playersData[0]?.is_creator && !amICreator && !hasJoinedRoom && !hasPlayerTwo
      
      console.log('🔍 Join room check:', {
        playersLength: playersData.length,
        hasCreator: playersData.some(p => p.is_creator),
        amICreator,
        hasJoinedRoom,
        hasPlayerTwo,
        shouldJoinAsPlayerTwo
      })
      
      if (shouldJoinAsPlayerTwo) {
        try {
          console.log('🚪 Attempting to join room as Player 2')
          setHasJoinedRoom(true) // Prevent multiple join attempts
          await roomService.joinRoom(roomId!)
          // Reload players after joining
          playersData = await roomService.getRoomPlayers(roomId!)
          console.log('✅ Successfully joined room')
        } catch (err) {
          console.error('❌ Failed to join room:', err)
          setHasJoinedRoom(false) // Reset on failure so user can retry
        }
      }
      
      setRoom(roomData)
      setPlayers(playersData)
      
      // Check for pending players (creators need to see this)
      if (amICreator) {
        const unapprovedPlayer = playersData.find(p => !p.is_creator && !p.approved)
        setPendingPlayer(unapprovedPlayer || null)
      }
      
      // Debug: Log what we found
      console.log('🔍 LOBBY DEBUG:', {
        playersCount: playersData.length,
        players: playersData.map(p => ({ 
          name: p.player_name, 
          is_creator: p.is_creator, 
          approved: p.approved 
        })),
        roomId,
        pendingPlayer: playersData.find(p => !p.is_creator && !p.approved)
      })
      
      setIsCreator(amICreator)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyGameLink = async () => {
    const gameUrl = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(gameUrl)
      setCopied(true)
      // Reset after 3 seconds
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = gameUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleStartGame = () => {
    // TODO: Start game for all players
    navigate(`/game/${roomId}`)
  }

  const handleAdmitPlayer = async () => {
    console.log('🎯 ADMIT PLAYER clicked!', { pendingPlayer, roomId })
    if (!pendingPlayer) return
    
    try {
      console.log('🔄 Loading puzzles...')
      const puzzleData = await puzzleService.getPuzzles()
      const puzzlesPerGame = settingsService.getPuzzlesPerGame()
      console.log(`🎲 Got ${puzzleData.length} puzzles, need ${puzzlesPerGame}`)
      
      // Shuffle puzzles and pick the required number
      const shuffledPuzzles = [...puzzleData].sort(() => Math.random() - 0.5)
      const selectedPuzzleIds = shuffledPuzzles.slice(0, puzzlesPerGame).map(p => p.id)
      console.log('🎮 Selected puzzle IDs:', selectedPuzzleIds)
      
      // Start the game with the puzzle sequence
      console.log('🚀 Starting game...')
      await roomService.startGame(roomId!, selectedPuzzleIds)
      console.log('✅ Approving player...')
      await roomService.approvePlayer(pendingPlayer.id)
      
      // Immediately navigate both players to game
      console.log('🎯 Navigating to game...')
      navigate(`/game/${roomId}`)
    } catch (err) {
      console.error('❌ Failed to admit player:', err)
      alert(`Error: ${err}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Room Error</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const creatorView = (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">{uiCopyService.getValue('lobby.title')}</h1>
      
      {/* Microphone Setup */}
      <div className="max-w-md mx-auto mb-6">
        <MicrophoneSetup onDebugInfo={setMicrophoneDebugInfo} />
      </div>
      
      {players.length === 1 ? (
        <div>
          <p className="text-xl text-gray-400 mb-8">{uiCopyService.getValue('lobby.share')}</p>
          <Button
            onClick={handleCopyGameLink}
            disabled={copied}
            size="lg"
            className={`${
              copied 
                ? 'bg-green-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-lg min-w-[200px]`}
          >
            {copied ? `✓ ${uiCopyService.getValue('lobby.copied')}` : uiCopyService.getValue('lobby.copy')}
          </Button>
          {copied && (
            <p className="text-sm text-gray-500 mt-3 animate-fade-in">
              {uiCopyService.getValue('lobby.copied.help')}
            </p>
          )}
        </div>
      ) : pendingPlayer ? (
        <div>
          <p className="text-xl text-yellow-400 mb-4">🚨 {pendingPlayer.player_name} {uiCopyService.getValue('lobby.join.alert')}</p>
          <p className="text-gray-400 mb-6">{uiCopyService.getValue('lobby.join.help')}</p>
          <Button
            onClick={handleAdmitPlayer}
            size="lg"
            className="bg-yellow-600 hover:bg-yellow-700 text-lg mb-4"
          >
            {uiCopyService.getValue('lobby.join.button')} {pendingPlayer.player_name}
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-xl text-green-400 mb-4">{uiCopyService.getValue('lobby.ready')}</p>
          <div className="mb-8">
            <div className="space-y-2">
              {players.filter(p => p.approved).map((player) => (
                <div key={player.id} className="bg-gray-800 rounded-lg px-4 py-2 inline-block mr-2">
                  {player.player_name} {player.is_creator && '👑'}
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={handleStartGame}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-lg"
          >
            {uiCopyService.getValue('lobby.start')}
          </Button>
        </div>
      )}
    </div>
  )

  const joinerView = (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">MOJI!</h1>
      
      {/* Microphone Setup */}
      <div className="max-w-md mx-auto mb-6">
        <MicrophoneSetup onDebugInfo={setMicrophoneDebugInfo} />
      </div>
      
      {(() => {
        const myPlayer = players.find(p => !p.is_creator)
        if (myPlayer?.approved) {
          return (
            <div>
              <p className="text-xl text-green-400 mb-4">✅ Starting game...</p>
            </div>
          )
        } else {
          return (
            <p className="text-xl text-gray-400 mb-8">{uiCopyService.getValue('lobby.waiting.host')}</p>
          )
        }
      })()}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      {isCreator ? creatorView : joinerView}
      
      <DebugOverlay 
        viewName="Lobby"
        additionalInfo={{
          roomId,
          isCreator,
          playersCount: players.length,
          loading,
          error: error || 'none',
          pendingPlayer: pendingPlayer?.player_name || 'none',
          copied,
          players: players.map(p => ({
            name: p.player_name,
            isCreator: p.is_creator,
            approved: p.approved
          })),
          sessionStorage: {
            roomCreator: sessionStorage.getItem(`room-creator-${roomId}`)
          },
          localStorage: {
            micPermission: roomId ? sessionStorage.getItem(`moji-mic-permission-${roomId}`) : null
          },
          microphone: microphoneDebugInfo || 'loading...'
        }}
      />
    </div>
  )
}

export default Lobby