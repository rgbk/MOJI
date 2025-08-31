import { useState, useEffect } from 'react'
import Timer from './Timer'
import PlayerAvatar from './PlayerAvatar'
import EmojiPuzzle from './EmojiPuzzle'
import AnswerInput from './AnswerInput'
import AnswerReveal from './AnswerReveal'
import { getVideoUrl } from '../lib/video'
import { settingsService } from '../lib/settings'
import { puzzleService, type Puzzle } from '../lib/puzzles'
import { roomService, type GameRoom } from '../lib/rooms'
import { supabase } from '../lib/supabase'

interface GameScreenProps {
  gameId: string
}

function GameScreen({ gameId }: GameScreenProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [roomData, setRoomData] = useState<GameRoom | null>(null)
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [playerId] = useState(() => `player_${Date.now()}`)
  const [timeLeft, setTimeLeft] = useState(settingsService.getRoundTimer())
  const [answer, setAnswer] = useState('')
  const [showError, setShowError] = useState(false)
  const [cluesUsed, setCluesUsed] = useState(0)
  const [showClue, setShowClue] = useState(false)
  const [showAnswerReveal, setShowAnswerReveal] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [roundWinner, setRoundWinner] = useState<'player1' | 'player2' | null>(null)
  const [waitingForOtherPlayer, setWaitingForOtherPlayer] = useState(false)
  
  // Get current settings
  const roundTimer = settingsService.getRoundTimer()
  const winCondition = settingsService.getWinCondition()
  const puzzlesPerGame = settingsService.getPuzzlesPerGame()

  // Shuffle array function (Fisher-Yates shuffle)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Load puzzles and set up multiplayer on component mount
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        console.log('🔄 GameScreen: Loading puzzles...')
        
        // Check if this is a multiplayer game with a room
        const roomDataResult = await roomService.getRoomById(gameId)
        
        if (roomDataResult?.puzzle_sequence) {
          // Multiplayer game - use the room's puzzle sequence
          console.log('🎮 GameScreen: Loading multiplayer puzzle sequence:', roomDataResult.puzzle_sequence)
          setIsMultiplayer(true)
          setRoomData(roomDataResult)
          setCurrentPuzzleIndex(roomDataResult.current_puzzle_index || 0)
          setPlayer1Score(roomDataResult.player1_score || 0)
          setPlayer2Score(roomDataResult.player2_score || 0)
          
          const allPuzzles = await puzzleService.getPuzzles()
          const gamePuzzles = roomDataResult.puzzle_sequence.map(id => 
            allPuzzles.find(p => p.id === id)
          ).filter(p => p !== undefined) as Puzzle[]
          
          console.log(`✅ GameScreen: Loaded ${gamePuzzles.length} synced puzzles for multiplayer`)
          setPuzzles(gamePuzzles)
          
          // Set up real-time subscription for multiplayer updates
          const subscription = supabase
            .channel(`game-${gameId}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${gameId}`
              },
              (payload) => {
                console.log('🔄 Real-time game update:', payload.new)
                const updated = payload.new as GameRoom
                setRoomData(updated)
                setCurrentPuzzleIndex(updated.current_puzzle_index || 0)
                setPlayer1Score(updated.player1_score || 0)
                setPlayer2Score(updated.player2_score || 0)
                
                // Handle game state changes
                if (updated.game_state === 'showing_answer') {
                  setShowAnswerReveal(true)
                  setRoundWinner(updated.round_winner as 'player1' | 'player2' || null)
                  setLastAnswerCorrect(!!updated.round_winner)
                } else if (updated.game_state === 'playing') {
                  setShowAnswerReveal(false)
                  setWaitingForOtherPlayer(false)
                  setTimeLeft(roundTimer)
                }
              }
            )
            .subscribe()
            
          // Cleanup subscription on unmount
          return () => {
            subscription.unsubscribe()
          }
        } else {
          // Single player or fallback - generate random puzzles
          console.log('👤 GameScreen: Single player mode - generating random puzzles')
          const puzzleData = await puzzleService.getPuzzles()
          const shuffledPuzzles = shuffleArray(puzzleData)
          const gamePuzzles = shuffledPuzzles.slice(0, puzzlesPerGame)
          
          console.log(`🎲 GameScreen: Selected ${gamePuzzles.length} random puzzles`)
          setPuzzles(gamePuzzles)
        }
        
        setLoadingError(null)
      } catch (error) {
        console.error('❌ GameScreen: Failed to load puzzles:', error)
        setLoadingError(error instanceof Error ? error.message : 'Failed to load puzzles')
      }
    }
    loadPuzzles()
  }, [gameId, roundTimer])

  const currentPuzzle = puzzles[currentPuzzleIndex]

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0 && currentPuzzle) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && currentPuzzle) {
      // Time's up - move to next puzzle
      handleTimeUp()
    }
  }, [timeLeft, currentPuzzle])

  const handleTimeUp = async () => {
    if (isMultiplayer && roomData) {
      // Multiplayer: Update room state for all players to see
      await roomService.updateGameState(gameId, {
        game_state: 'showing_answer',
        round_winner: undefined,
        players_ready_for_next: []
      })
    } else {
      // Single player: Handle locally
      setLastAnswerCorrect(false)
      setRoundWinner(null)
      setShowAnswerReveal(true)
    }
  }

  const handleNextRound = async () => {
    if (isMultiplayer && roomData) {
      // Multiplayer: Mark this player as ready and wait for both players
      setWaitingForOtherPlayer(true)
      await roomService.markPlayerReady(gameId, playerId)
      
      // Reset local state
      setCluesUsed(0)
      setShowClue(false)
      setAnswer('')
      setRoundWinner(null)
    } else {
      // Single player: Move to next puzzle immediately
      setShowAnswerReveal(false)
      setCluesUsed(0)
      setShowClue(false)
      setAnswer('')
      setRoundWinner(null)
      
      if (currentPuzzleIndex < puzzles.length - 1) {
        setCurrentPuzzleIndex(prev => prev + 1)
        setTimeLeft(roundTimer)
      } else {
        console.log('Game completed!')
      }
    }
  }

  const handleAnswerSubmit = async (inputAnswer: string) => {
    const normalizedAnswer = inputAnswer.toLowerCase().trim()
    const isCorrect = currentPuzzle.answers.some(correctAnswer => 
      normalizedAnswer === correctAnswer.toLowerCase()
    )

    if (isCorrect) {
      if (isMultiplayer && roomData) {
        // Multiplayer: Update room state for all players to see
        const newScore = player1Score + 1
        await roomService.updateGameState(gameId, {
          game_state: 'showing_answer',
          round_winner: 'player1',
          player1_score: newScore,
          players_ready_for_next: []
        })
        
        // Check win condition
        if (newScore >= winCondition) {
          console.log('Player 1 wins the game!', { score: newScore, winCondition })
          // TODO: Show game over screen
        }
      } else {
        // Single player: Handle locally
        const newScore = player1Score + 1
        setPlayer1Score(newScore)
        setLastAnswerCorrect(true)
        setRoundWinner('player1')
        setShowAnswerReveal(true)
        
        // Check win condition
        if (newScore >= winCondition) {
          console.log('Player 1 wins the game!', { score: newScore, winCondition })
          // TODO: Show game over screen
        }
      }
      setAnswer('')
    } else {
      setShowError(true)
      setTimeout(() => setShowError(false), 2000)
    }
  }

  const handleClueRequest = () => {
    if (cluesUsed < 3) {
      setCluesUsed(prev => prev + 1)
      setShowClue(true)
    }
  }

  // Show error screen if loading failed
  if (loadingError) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Failed to Load Puzzles</h2>
          <p className="text-red-400 mb-4">{loadingError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Reload Game
          </button>
        </div>
      </div>
    )
  }

  // Don't render until puzzles are loaded
  if (!currentPuzzle) {
    console.log('🔍 GameScreen Debug:', { puzzles: puzzles.length, currentPuzzleIndex, currentPuzzle, loadingError })
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading puzzles...</p>
          <p className="text-sm mt-2 opacity-70">
            Loaded: {puzzles.length} puzzles, Index: {currentPuzzleIndex}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden">
      {/* Main container with proper mobile layout */}
      <div className="flex flex-col h-full pt-safe">
        {/* Header with Player Scores */}
        <div className="flex justify-between items-center mb-6">
          <PlayerAvatar
            playerId="player1"
            score={player1Score}
            isActive={true}
          />
          
          <div className="text-center">
            <p className="text-sm text-gray-400">Game: {gameId}</p>
          </div>
          
          <PlayerAvatar
            playerId="player2"
            score={player2Score}
            isActive={false}
          />
        </div>

        {/* Timer */}
        <Timer timeLeft={timeLeft} maxTime={roundTimer} />

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
          <EmojiPuzzle
            emoji={currentPuzzle.emoji}
            type={currentPuzzle.type}
            showError={showError}
            clue={showClue && cluesUsed > 0 ? currentPuzzle.clues[cluesUsed - 1] : undefined}
          />
        </div>

        {/* Answer Input - Fixed to bottom */}
        <div className="flex-shrink-0 p-4 pb-safe bg-gray-900">
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleAnswerSubmit}
            onClueRequest={handleClueRequest}
            clueCount={cluesUsed}
            placeholder="Type your guess..."
          />
        </div>
      </div>

      {/* Answer Reveal Modal */}
      {showAnswerReveal && (
        <AnswerReveal
          answer={currentPuzzle.displayAnswer}
          isCorrect={lastAnswerCorrect}
          playerWon={roundWinner}
          onNext={handleNextRound}
          videoUrl={getVideoUrl(currentPuzzle.videoFile) || undefined}
          links={currentPuzzle.links}
          isMultiplayer={isMultiplayer}
          waitingForOtherPlayer={waitingForOtherPlayer}
        />
      )}
    </div>
  )
}

export default GameScreen