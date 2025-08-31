import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const handleStartNewGame = () => {
    // TODO: Create room in database and go to lobby
    // For now, go to single-player game (temporary)
    const gameId = Math.random().toString(36).substr(2, 8).toUpperCase()
    navigate(`/game/${gameId}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      {/* Game Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4">
          MOJI!
        </h1>
        <p className="text-xl text-gray-400">
          Guess the song from emoji clues
        </p>
      </div>

      {/* Start Game Button */}
      <button
        onClick={handleStartNewGame}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors duration-200 shadow-lg hover:shadow-purple-500/25"
      >
        START NEW GAME
      </button>
    </div>
  )
}

export default Home