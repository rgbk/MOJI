import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { BROWSER_INFO, getSafariErrorMessage } from '../utils/browserDetection'
import { audioFeedback } from '../lib/audio'

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
  const { roomId } = useParams()
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false)
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false)

  // Initialize voice recognition for Push-to-Talk with room-specific persistence
  const {
    state: voiceState,
    transcript,
    confidence,
    isSupported: voiceSupported,
    isListening,
    error: voiceError,
    permissionGranted,
    startPushToTalk,
    stopPushToTalk,
    resetTranscript,
    requestPermission
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: true, // Keep listening while button is held
    interimResults: true,
    confidenceThreshold: 0.0, // Accept all confidence levels
    enableAudioFeedback: true
  }, roomId)

  // Always sync transcript to input field for Push-to-Talk
  useEffect(() => {
    if (transcript) {
      console.log('🎮 Syncing transcript to input:', transcript)
      onChange(transcript)
    }
  }, [transcript, onChange])

  // Auto-submit when voice recognition completes and we have a transcript
  useEffect(() => {
    if (shouldAutoSubmit && !isListening) {
      console.log('🎮 Voice stopped listening, checking for auto-submit...', { 
        transcript, 
        value, 
        trimmedTranscript: transcript.trim(),
        trimmedValue: value.trim()
      })
      
      // Use the input value (which should have the transcript) or the transcript itself
      const textToSubmit = value.trim() || transcript.trim()
      
      if (textToSubmit) {
        console.log('🎮 Auto-submitting voice input:', textToSubmit)
        setShouldAutoSubmit(false)
        setTimeout(() => {
          handleSubmit()
        }, 100)
      } else {
        console.log('🎮 No text to submit, canceling auto-submit')
        setShouldAutoSubmit(false)
      }
    }
  }, [shouldAutoSubmit, transcript, value, isListening])

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
  const handlePushToTalkStart = async () => {
    if (!voiceSupported || disabled) return
    
    const logPrefix = BROWSER_INFO.isSafari ? '🦁 Safari Push-to-Talk start:' : '🎮 Push-to-Talk start requested'
    console.log(logPrefix, { 
      voiceSupported, 
      disabled, 
      permissionGranted,
      voiceState,
      isSafari: BROWSER_INFO.isSafari
    })
    
    // Mark user gesture for Safari AudioContext
    if (BROWSER_INFO.isSafari) {
      audioFeedback.markUserGesture()
    }
    
    // If permission not granted, request it first
    if (permissionGranted === false || permissionGranted === null) {
      const permissionLogPrefix = BROWSER_INFO.isSafari ? '🦁 Safari: Requesting microphone permission...' : '🎮 Requesting microphone permission...'
      console.log(permissionLogPrefix)
      const granted = await requestPermission()
      if (!granted) {
        const deniedLogPrefix = BROWSER_INFO.isSafari ? '🦁 Safari: Permission denied' : '🎮 Permission denied, cannot start voice input'
        console.log(deniedLogPrefix)
        // Error message is already set by requestPermission
        return
      }
    }
    
    console.log(BROWSER_INFO.isSafari ? '🦁 Safari Push-to-Talk started' : '🎮 Push-to-Talk started')
    setIsPushToTalkHeld(true)
    startPushToTalk()
  }

  const handlePushToTalkEnd = () => {
    if (!voiceSupported || !isPushToTalkHeld) return
    
    const logPrefix = BROWSER_INFO.isSafari ? '🦁 Safari Push-to-Talk ended:' : '🎮 Push-to-Talk ended, current state:'
    console.log(logPrefix, { 
      transcript, 
      value, 
      isListening,
      isSafari: BROWSER_INFO.isSafari
    })
    setIsPushToTalkHeld(false)
    stopPushToTalk()
    
    // Always mark for auto-submit, let the effect decide if there's text to submit
    setShouldAutoSubmit(true)
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // If permission denied, just request permission (don't start listening)
    if (permissionGranted === false) {
      console.log('🎮 Permission denied - requesting permission instead of starting Push-to-Talk')
      requestPermission()
      return
    }
    
    handlePushToTalkStart()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    handlePushToTalkEnd()
  }

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    
    // If permission denied, just request permission (don't start listening)
    if (permissionGranted === false) {
      console.log('🎮 Permission denied - requesting permission instead of starting Push-to-Talk (touch)')
      requestPermission()
      return
    }
    
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
    if (permissionGranted === false) {
      return "bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800"
    }
    if (isListening || isPushToTalkHeld) {
      return "bg-red-500 hover:bg-red-600 animate-pulse scale-110 shadow-lg shadow-red-500/50"
    }
    return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
  }

  const getPushToTalkButtonTitle = () => {
    if (!voiceSupported) {
      return BROWSER_INFO.isSafari 
        ? "Voice input not supported in this version of Safari"
        : "Voice input not supported in this browser"
    }
    if (voiceError && voiceError.includes('secure')) {
      return BROWSER_INFO.isSafari
        ? "Safari requires HTTPS for microphone access"
        : "HTTPS required for microphone access"
    }
    if (permissionGranted === false) {
      return BROWSER_INFO.isSafari
        ? "Microphone access denied - tap to request permission again (check Safari settings)"
        : "Microphone access denied - click to request permission again"
    }
    if (voiceState === 'error' && voiceError) {
      // Use Safari-specific error message if available
      const errorMsg = BROWSER_INFO.isSafari 
        ? getSafariErrorMessage(voiceError.split(':')[0] || voiceError, BROWSER_INFO)
        : voiceError
      return `Error: ${errorMsg}`
    }
    if (isListening || isPushToTalkHeld) {
      return BROWSER_INFO.isSafari
        ? "Release to submit your answer (Safari)"
        : "Release to submit your answer"
    }
    if (permissionGranted === null) {
      return BROWSER_INFO.isSafari
        ? "Hold to speak (Safari will request microphone permission)"
        : "Hold to speak (will request microphone permission)"
    }
    return BROWSER_INFO.isSafari
      ? "Hold to speak (Push-to-Talk Safari)"
      : "Hold to speak (Push-to-Talk)"
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
          
          {/* Status indicators */}
          {!voiceSupported && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {voiceSupported && permissionGranted === false && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
          
          {/* Submit button - make it more prominent when there's text */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              value.trim() 
                ? 'bg-green-500 hover:bg-green-600 scale-110 shadow-lg' 
                : 'bg-blue-500 hover:bg-blue-600'
            } disabled:bg-gray-600 disabled:scale-100`}
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
          <p>Type your answer and press Enter or tap the {value.trim() ? 'green' : 'blue'} arrow</p>
          {voiceSupported && permissionGranted !== false && (
            <p className="mt-1">Or hold the microphone button while speaking (Push-to-Talk)</p>
          )}
          {voiceSupported && permissionGranted === false && !voiceError?.includes('secure') && (
            <p className="mt-1 text-yellow-400">Microphone access denied - tap microphone to request permission</p>
          )}
          {voiceSupported && voiceError?.includes('secure') && (
            <p className="mt-1 text-red-400">HTTPS required for microphone access</p>
          )}
          {voiceSupported && permissionGranted === null && !voiceError && (
            <p className="mt-1 text-blue-400">First use will request microphone permission</p>
          )}
          {voiceError && !voiceError.includes('secure') && (
            <p className="mt-1 text-red-400">Voice input error: {voiceError}</p>
          )}
          {!voiceSupported && (
            <p className="mt-1 text-yellow-600">Voice input not supported in this browser</p>
          )}
          {value.trim() && (
            <p className="mt-1 text-green-400 font-medium">Ready to submit: "{value.trim()}"</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnswerInput