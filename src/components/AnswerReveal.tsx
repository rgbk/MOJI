import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { cn } from '../lib/utils'
import { uiCopyService } from '../lib/uiCopy'

interface AnswerRevealProps {
  answer: string
  isCorrect: boolean
  playerWon?: 'player1' | 'player2' | null
  onNext: () => void
  showVideo?: boolean
  videoUrl?: string
  links?: { name: string; url: string }[]
  isMultiplayer?: boolean
  waitingForOtherPlayer?: boolean
  isPlayer1?: boolean
}

function AnswerReveal({ 
  answer, 
  isCorrect, 
  playerWon,
  onNext,
  showVideo = false,
  videoUrl,
  links = [],
  isMultiplayer = false,
  waitingForOtherPlayer = false,
  isPlayer1 = true
}: AnswerRevealProps) {
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasPlayedConfetti = useRef(false)
  
  useEffect(() => {
    if (isCorrect && playerWon && !hasPlayedConfetti.current) {
      hasPlayedConfetti.current = true
      // Celebrate with confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      // Second burst after delay
      confettiTimeoutRef.current = setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0.7 }
        })
      }, 500)
    }
    
    // Cleanup on unmount
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current)
      }
      confetti.reset()
      hasPlayedConfetti.current = false
    }
  }, [isCorrect, playerWon])
  
  const handleNextClick = () => {
    // Stop all confetti animations immediately
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current)
      confettiTimeoutRef.current = null
    }
    confetti.reset()
    hasPlayedConfetti.current = false
    onNext()
  }
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 text-center">
        {/* Result indicator */}
        <div className={cn(
          "text-6xl mb-4",
          isCorrect ? "animate-bounce" : "animate-pulse"
        )}>
          {isCorrect ? "✅" : "❌"}
        </div>

        {/* Winner announcement */}
        {playerWon && (
          <div className="text-2xl font-bold mb-4">
            <span className={cn(
              playerWon === 'player1' ? 'text-blue-400' : 'text-red-400'
            )}>
              {isMultiplayer ? (
                // In multiplayer, show from each player's perspective
                (isPlayer1 && playerWon === 'player1') || (!isPlayer1 && playerWon === 'player2')
                  ? uiCopyService.getValue('answer.correct.you')
                  : uiCopyService.getValue('answer.correct.opponent')
              ) : (
                // In single player, always show YOU WON
                uiCopyService.getValue('answer.correct.you')
              )}
            </span>
          </div>
        )}

        {/* Answer display */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="text-gray-400 text-sm uppercase tracking-wide mb-2">
            {uiCopyService.getValue('answer.label')}
          </div>
          <div className="text-2xl font-bold text-white mb-4">
            {answer}
          </div>
          
          {/* Music links */}
          {links.length > 0 && (
            <div className="flex justify-center space-x-4">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Next button */}
        {waitingForOtherPlayer ? (
          <div className="w-full py-4 bg-gray-600 rounded-xl text-white font-bold text-lg text-center">
            <div className="animate-pulse">⏳ {uiCopyService.getValue('answer.waiting')}</div>
          </div>
        ) : (
          <button
            onClick={handleNextClick}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold text-lg transition-colors duration-200"
          >
            {isMultiplayer ? uiCopyService.getValue('answer.next.multi') : uiCopyService.getValue('answer.next.single')}
          </button>
        )}

      </div>

      {/* Video background (if enabled) */}
      {showVideo && videoUrl && (
        <div className="fixed inset-0 -z-10">
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
    </div>
  )
}

export default AnswerReveal