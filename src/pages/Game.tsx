import { useParams } from 'react-router-dom'
import GameScreen from '../components/GameScreen'
import DebugOverlay from '../components/DebugOverlay'

function Game() {
  const { gameId } = useParams()

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Invalid game ID</p>
        <DebugOverlay 
          viewName="Game-Error"
          additionalInfo={{
            error: 'missing-gameId'
          }}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <GameScreen gameId={gameId} />
      <DebugOverlay 
        viewName="Game"
        additionalInfo={{
          gameId
        }}
      />
    </div>
  )
}

export default Game