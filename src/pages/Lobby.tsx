import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomService, type GameRoom, type RoomPlayer } from '../lib/rooms'

function Lobby() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    if (!roomId) {
      setError('Invalid room ID')
      setLoading(false)
      return
    }

    loadRoomData()
  }, [roomId])

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
      
      // Only join as Player 2 if I didn't create this room
      if (playersData.length === 1 && playersData[0]?.is_creator && !amICreator) {
        try {
          await roomService.joinRoom(roomId!)
          // Reload players after joining
          playersData = await roomService.getRoomPlayers(roomId!)
        } catch (err) {
          console.error('Failed to join room:', err)
        }
      }
      
      setRoom(roomData)
      setPlayers(playersData)
      
      // Debug: Log what we found
      console.log('🔍 LOBBY DEBUG:', {
        playersCount: playersData.length,
        players: playersData.map(p => ({ name: p.player_name, is_creator: p.is_creator })),
        roomId
      })
      
      // Use sessionStorage to reliably track who created the room
      console.log('🔍 CREATOR LOGIC:', { 
        creator: playersData.find(p => p.is_creator)?.player_name,
        sessionStorageCreator: sessionStorage.getItem(`room-creator-${roomId}`),
        playersCount: playersData.length,
        amICreator 
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
      // TODO: Show success message
    } catch (err) {
      // Fallback for older browsers
      console.log('Copy this link:', gameUrl)
    }
  }

  const handleStartGame = () => {
    // TODO: Start game for all players
    navigate(`/game/${roomId}`)
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
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const creatorView = (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">MOJI!</h1>
      
      {players.length === 1 ? (
        <div>
          <p className="text-xl text-gray-400 mb-8">Share this game with a friend</p>
          <button
            onClick={handleCopyGameLink}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors duration-200"
          >
            COPY GAME LINK
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xl text-gray-400 mb-4">Player joined!</p>
          <div className="mb-8">
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="bg-gray-800 rounded-lg px-4 py-2 inline-block mr-2">
                  {player.player_name} {player.is_creator && '👑'}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleStartGame}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors duration-200"
          >
            START GAME
          </button>
        </div>
      )}
    </div>
  )

  const joinerView = (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">MOJI!</h1>
      <p className="text-xl text-gray-400 mb-8">Waiting for Player 1 to let you in...</p>
      
      {/* TODO: Add "PLAYER 2 HAS ARRIVED" notification and ADMIT system */}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      {isCreator ? creatorView : joinerView}
    </div>
  )
}

export default Lobby