import { useParams } from 'react-router-dom'
import GameScreen from '../components/GameScreen'

function Game() {
  const { gameId } = useParams()

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Invalid game ID</p>
      </div>
    )
  }

  return <GameScreen gameId={gameId} />
}

export default Game