import { useState, useEffect } from 'react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { MicrophoneIcon } from '@heroicons/react/24/solid'

interface AnswerInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onClueRequest: () => void
  clueCount: number
  placeholder?: string
  disabled?: boolean
}

function AnswerInput({ 
  value, 
  onChange, 
  onSubmit, 
  onClueRequest,
  clueCount,
  placeholder = "Type your answer...",
  disabled = false 
}: AnswerInputProps) {
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false)

  // Initialize voice recognition for Push-to-Talk
  const {
    state: voiceState,
    transcript,
    confidence,
    isSupported: voiceSupported,
    isListening,
    error: voiceError,
    startPushToTalk,
    stopPushToTalk,
    resetTranscript
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: true, // Keep listening while button is held
    interimResults: true,
    confidenceThreshold: 0.0, // Accept all confidence levels
    enableAudioFeedback: true
  })

  // Always sync transcript to input field for Push-to-Talk
  useEffect(() => {
    if (transcript) {
      console.log('🎮 Syncing transcript to input:', transcript)
      onChange(transcript)
    }
  }, [transcript, onChange])

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      console.log('🎮 Submitting answer:', value.trim())
      onSubmit(value.trim())
      resetTranscript() // Always reset after submit
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handleClueRequest = () => {
    onClueRequest()
  }

  // Push-to-Talk event handlers
  const handlePushToTalkStart = () => {
    if (!voiceSupported || disabled) return
    console.log('🎮 Push-to-Talk started')
    setIsPushToTalkHeld(true)
    startPushToTalk()
  }

  const handlePushToTalkEnd = () => {
    if (!voiceSupported || !isPushToTalkHeld) return
    console.log('🎮 Push-to-Talk ended')
    setIsPushToTalkHeld(false)
    stopPushToTalk()
    
    // Submit the transcript after stopping
    if (transcript && transcript.trim()) {
      setTimeout(() => {
        handleSubmit()
      }, 100) // Small delay to ensure recognition has finished
    }
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handlePushToTalkStart()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    handlePushToTalkEnd()
  }

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handlePushToTalkStart()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handlePushToTalkEnd()
  }

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!isPushToTalkHeld) {
        handlePushToTalkStart()
      }
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handlePushToTalkEnd()
    }
  }

  // Push-to-Talk button styling based on state
  const getPushToTalkButtonStyle = () => {
    if (!voiceSupported) {
      return "bg-gray-800 cursor-not-allowed"
    }
    if (isListening || isPushToTalkHeld) {
      return "bg-red-500 hover:bg-red-600 animate-pulse scale-110 shadow-lg shadow-red-500/50"
    }
    return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
  }

  const getPushToTalkButtonTitle = () => {
    if (!voiceSupported) {
      return "Voice input not supported in this browser"
    }
    if (isListening || isPushToTalkHeld) {
      return "Release to submit your answer"
    }
    return "Hold to speak (Push-to-Talk)"
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Push-to-Talk feedback area - always shown when voice is supported */}
      {voiceSupported && (isListening || transcript || voiceError) && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-red-500 animate-pulse' : 
                voiceState === 'processing' ? 'bg-yellow-500' :
                voiceState === 'error' ? 'bg-red-600' :
                'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-300">
                {isListening ? 'Hold button and speak...' : 
                 voiceState === 'processing' ? 'Processing...' :
                 voiceState === 'error' ? 'Error' :
                 'Push-to-Talk ready'}
              </span>
            </div>
          </div>
          
          {transcript && (
            <div className="text-sm text-white mb-2">
              <span className="text-gray-400">Transcript: </span>
              <span className="italic">"{transcript}"</span>
              {confidence > 0 && (
                <span className="text-xs text-gray-400 ml-2">
                  ({Math.round(confidence * 100)}% confident)
                </span>
              )}
            </div>
          )}
          
          {voiceError && (
            <div className="text-sm text-red-400 mb-2">
              {voiceError}
            </div>
          )}
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-center space-x-2 mb-4">
        {/* Push-to-Talk button */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Stop if mouse leaves while held
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={disabled || !voiceSupported}
          className={`flex-shrink-0 w-12 h-12 ${getPushToTalkButtonStyle()} disabled:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200 relative select-none`}
          title={getPushToTalkButtonTitle()}
          tabIndex={0}
        >
          {(isListening || isPushToTalkHeld) ? (
            // Recording icon with pulse animation
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
          ) : (
            // Microphone icon
            <MicrophoneIcon className="w-5 h-5 text-white" />
          )}
          
          {/* Voice not supported indicator */}
          {!voiceSupported && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              // Allow manual editing - it will override transcript
              onChange(e.target.value)
            }}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? 'Listening... (hold button and speak)' : placeholder}
            disabled={disabled}
            className={`w-full h-12 px-6 pr-16 bg-gray-800 border rounded-full text-white placeholder-gray-400 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
              isListening
                ? 'border-red-500 focus:border-red-400' 
                : 'border-gray-600 focus:border-blue-500'
            }`}
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
          
          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Clue button */}
        <button
          onClick={handleClueRequest}
          disabled={disabled || clueCount >= 3}
          className="flex-shrink-0 px-4 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 rounded-full text-white font-medium transition-colors duration-200"
          title="Request a clue"
        >
          CLUE ({clueCount}/3)
        </button>
      </div>

      {/* Input tips */}
      <div className="text-center text-xs text-gray-500">
        <div>
          <p>Type your answer and press Enter or tap the arrow</p>
          {voiceSupported && (
            <p className="mt-1">Or hold the microphone button while speaking (Push-to-Talk)</p>
          )}
          {!voiceSupported && (
            <p className="mt-1 text-yellow-600">Voice input not supported in this browser</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnswerInput