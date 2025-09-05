import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import Hls from 'hls.js'
import { cn } from '../lib/utils'
import { uiCopyService } from '../lib/uiCopy'

interface AnswerRevealProps {
  answer: string
  isCorrect: boolean
  playerWon?: 'player1' | 'player2' | null
  onNext: () => void
  showVideo?: boolean
  videoUrl?: string
  muxPlaybackId?: string
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
  muxPlaybackId,
  links = [],
  isMultiplayer = false,
  waitingForOtherPlayer = false,
  isPlayer1 = true
}: AnswerRevealProps) {
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasPlayedConfetti = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  
  // HLS setup effect
  useEffect(() => {
    if (showVideo && muxPlaybackId && videoRef.current) {
      const video = videoRef.current
      const hlsUrl = `https://stream.mux.com/${muxPlaybackId}.m3u8`
      
      console.log('🎥 Setting up HLS for:', hlsUrl)
      
      if (Hls.isSupported()) {
        // Use HLS.js for browsers without native HLS support
        console.log('🎥 Using HLS.js')
        const hls = new Hls({
          debug: false,
          enableWorker: true
        })
        
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('🎥 HLS manifest parsed, starting playback')
          video.play().catch(e => console.log('🎥 Autoplay blocked:', e))
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('🎥 HLS error:', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🎥 Fatal network error, trying to recover')
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🎥 Fatal media error, trying to recover')
                hls.recoverMediaError()
                break
              default:
                console.log('🎥 Fatal error, destroying HLS instance')
                hls.destroy()
                break
            }
          }
        })
        
        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        console.log('🎥 Using native HLS')
        video.src = hlsUrl
        video.play().catch(e => console.log('🎥 Autoplay blocked:', e))
      }
    }
    
    return () => {
      if (hlsRef.current) {
        console.log('🎥 Cleaning up HLS instance')
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [showVideo, muxPlaybackId])

  // Confetti effect
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
      {(() => {
        console.log('🎥 AnswerReveal video render check:', {
          showVideo,
          muxPlaybackId,
          videoUrl,
          shouldShowVideo: showVideo && (muxPlaybackId || videoUrl)
        })
        return showVideo && (muxPlaybackId || videoUrl) && (
          <div className="fixed inset-0 -z-10">
            {muxPlaybackId ? (
              // Use HLS.js for Mux video
              <video
                ref={videoRef}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
                poster={`https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?width=1920&height=1080&fit_mode=pad`}
                onLoadStart={() => console.log('🎥 Video element loading started')}
                onCanPlay={() => console.log('🎥 Video can play')}
                onError={(e) => console.error('🎥 Video error:', e)}
              />
            ) : videoUrl ? (
              // Fallback to regular video URL
              <video
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
                onLoadStart={() => console.log('🎥 Regular video loading started')}
                onCanPlay={() => console.log('🎥 Regular video can play')}
                onError={(e) => console.error('🎥 Regular video error:', e)}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : null}
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )
      })()}
    </div>
  )
}

export default AnswerReveal