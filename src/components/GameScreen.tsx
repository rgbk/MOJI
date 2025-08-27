import { useState, useEffect } from 'react'
import Timer from './Timer'
import PlayerAvatar from './PlayerAvatar'
import EmojiPuzzle from './EmojiPuzzle'
import AnswerInput from './AnswerInput'
import AnswerReveal from './AnswerReveal'
import { getVideoUrl } from '../lib/video'
import { puzzles } from '../data/puzzles.json'

interface GameScreenProps {
  gameId: string
}

function GameScreen({ gameId }: GameScreenProps) {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [answer, setAnswer] = useState('')
  const [showError, setShowError] = useState(false)
  const [cluesUsed, setCluesUsed] = useState(0)
  const [showClue, setShowClue] = useState(false)
  const [showAnswerReveal, setShowAnswerReveal] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [roundWinner, setRoundWinner] = useState<'player1' | 'player2' | null>(null)

  const currentPuzzle = puzzles[currentPuzzleIndex]

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else {
      // Time's up - move to next puzzle
      handleTimeUp()
    }
  }, [timeLeft])

  const handleTimeUp = () => {
    setLastAnswerCorrect(false)
    setRoundWinner(null)
    setShowAnswerReveal(true)
  }

  const handleNextRound = () => {
    setShowAnswerReveal(false)
    setCluesUsed(0)
    setShowClue(false)
    setAnswer('')
    setRoundWinner(null)
    
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1)
      setTimeLeft(60)
    } else {
      console.log('Game completed!')
    }
  }

  const handleAnswerSubmit = (inputAnswer: string) => {
    const normalizedAnswer = inputAnswer.toLowerCase().trim()
    const isCorrect = currentPuzzle.answers.some(correctAnswer => 
      normalizedAnswer === correctAnswer.toLowerCase()
    )

    if (isCorrect) {
      setPlayer1Score(prev => prev + 1)
      setLastAnswerCorrect(true)
      setRoundWinner('player1')
      setShowAnswerReveal(true)
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
        <Timer timeLeft={timeLeft} maxTime={60} />

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
          videoUrl={getVideoUrl(currentPuzzle.videoFile)}
          links={currentPuzzle.links}
        />
      )}
    </div>
  )
}

export default GameScreen