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
import { Button } from './ui/button'
import { supabase } from '../lib/supabase'
import { uiCopyService } from '../lib/uiCopy'

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
  const [isPlayer1, setIsPlayer1] = useState(false)
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
        
        // Check if this is a multiplayer game with a room
        const roomDataResult = await roomService.getRoomById(gameId)
        
        if (roomDataResult?.puzzle_sequence) {
          // Multiplayer game - use the room's puzzle sequence
          setIsMultiplayer(true)
          setRoomData(roomDataResult)
          setCurrentPuzzleIndex(roomDataResult.current_puzzle_index || 0)
          setPlayer1Score(roomDataResult.player1_score || 0)
          setPlayer2Score(roomDataResult.player2_score || 0)
          
          // Determine if this is player 1 (room creator)
          const sessionKey = `room-creator-${gameId}`
          const sessionValue = sessionStorage.getItem(sessionKey)
          const isCreator = sessionValue === 'true'
          setIsPlayer1(isCreator)
          
          const allPuzzles = await puzzleService.getPuzzles()
          const gamePuzzles = roomDataResult.puzzle_sequence.map(id => 
            allPuzzles.find(p => p.id === id)
          ).filter(p => p !== undefined) as Puzzle[]
          
          setPuzzles(gamePuzzles)
          
          // Set up real-time subscription for multiplayer updates
          console.log('🔗 SETTING UP SUBSCRIPTION - Player', isPlayer1 ? '1' : '2', 'gameId:', gameId)
          const subscription = supabase
            .channel(`room_${gameId}_${Math.random()}`) // Unique channel name
            .on(
              'postgres_changes',
              {
                event: '*', // Listen to all events
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${gameId}`
              },
              (payload) => {
                console.log('🚨 REAL-TIME RECEIVED:', payload.eventType, payload.new?.game_state, 'Player:', isPlayer1 ? '1' : '2')
                if (payload.eventType === 'UPDATE') {
                  const updated = payload.new as GameRoom
                  setRoomData(updated)
                  setCurrentPuzzleIndex(updated.current_puzzle_index || 0)
                  setPlayer1Score(updated.player1_score || 0)
                  setPlayer2Score(updated.player2_score || 0)
                  
                  if (updated.game_state === 'showing_answer') {
                    setShowAnswerReveal(true)
                    const winner = updated.round_winner as 'player1' | 'player2' || null
                    setRoundWinner(winner)
                    const thisPlayerWon = winner === (isPlayer1 ? 'player1' : 'player2')
                    setLastAnswerCorrect(thisPlayerWon)
                  } else if (updated.game_state === 'playing') {
                    setShowAnswerReveal(false)
                    setWaitingForOtherPlayer(false)
                  }
                }
              }
            )
            .subscribe((status) => {
              console.log('📡 Subscription status - Player', isPlayer1 ? '1' : '2', ':', status)
            })
            
          // Cleanup subscription on unmount
          return () => {
            subscription.unsubscribe()
          }
        } else {
          // Single player or fallback - generate random puzzles
          const puzzleData = await puzzleService.getPuzzles()
          const shuffledPuzzles = shuffleArray(puzzleData)
          const gamePuzzles = shuffledPuzzles.slice(0, puzzlesPerGame)
          
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

  // Shared timestamp-based timer effect
  useEffect(() => {
    if (!currentPuzzle) return
    
    // For multiplayer, use shared timestamp
    if (isMultiplayer && roomData?.round_started_at) {
      const updateTimer = () => {
        const startTime = new Date(roomData.round_started_at!).getTime()
        const currentTime = new Date().getTime()
        const elapsed = Math.floor((currentTime - startTime) / 1000)
        const remaining = Math.max(0, roundTimer - elapsed)
        
        setTimeLeft(remaining)
        
        // Auto-expire when time runs out (only log once)
        if (remaining === 0 && roomData.game_state === 'playing') {
          handleTimeUp()
        }
      }

      // Update immediately and then every second
      updateTimer()
      const timer = setInterval(updateTimer, 1000)
      
      return () => clearInterval(timer)
    } 
    // For single player, use traditional countdown
    else if (!isMultiplayer && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          if (newTime === 0) {
            handleTimeUp()
          }
          return newTime
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentPuzzle, roomData?.round_started_at, roomData?.game_state, roundTimer, isMultiplayer, timeLeft])

  const handleTimeUp = async () => {
    if (isMultiplayer && roomData) {
      // Only trigger if still in playing state (prevent duplicate calls)
      if (roomData.game_state === 'playing') {
        // Let real-time subscription handle UI updates
        
        await roomService.updateGameState(gameId, {
          game_state: 'showing_answer',
          round_winner: undefined,
          players_ready_for_next: []
        })
      }
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
        const winnerKey = isPlayer1 ? 'player1' : 'player2'
        const scoreKey = isPlayer1 ? 'player1_score' : 'player2_score'
        const currentScore = isPlayer1 ? player1Score : player2Score
        const newScore = currentScore + 1
        
        // Let real-time subscription handle UI updates
        
        await roomService.updateGameState(gameId, {
          game_state: 'showing_answer',
          round_winner: winnerKey,
          [scoreKey]: newScore,
          players_ready_for_next: []
        })
        
        // Check win condition
        if (newScore >= winCondition) {
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
          <h2 className="text-xl font-bold mb-2">{uiCopyService.getValue('game.error.title')}</h2>
          <p className="text-red-400 mb-4">{loadingError}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uiCopyService.getValue('game.error.reload')}
          </Button>
        </div>
      </div>
    )
  }

  // Don't render until puzzles are loaded
  if (!currentPuzzle) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>{uiCopyService.getValue('game.waiting')}</p>
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
            isActive={isPlayer1}
            isYou={isPlayer1}
          />
          
          <div className="text-center">
            <p className="text-sm text-gray-400">{uiCopyService.getValue('game.room.label')} {gameId}</p>
          </div>
          
          <PlayerAvatar
            playerId="player2"
            score={player2Score}
            isActive={!isPlayer1}
            isYou={!isPlayer1}
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
            placeholder={uiCopyService.getValue('game.input.placeholder')}
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
              showVideo={true}
              videoUrl={getVideoUrl(currentPuzzle.videoFile) || undefined}
              muxPlaybackId={currentPuzzle.muxPlaybackId}
              links={currentPuzzle.links}
              isMultiplayer={isMultiplayer}
              waitingForOtherPlayer={waitingForOtherPlayer}
              isPlayer1={isPlayer1}
            />
      )}
    </div>
  )
}

export default GameScreen