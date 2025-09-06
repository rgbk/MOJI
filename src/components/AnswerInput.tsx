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
  const { roomId, gameId } = useParams()
  const actualRoomId = roomId || gameId // Use gameId if roomId is not available
  
  // Component initialization
  useEffect(() => {
    // Component loaded
  }, [actualRoomId])
  const [isRecording, setIsRecording] = useState(false)
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false)

  // Initialize voice recognition for toggle recording
  const {
    state: voiceState,
    transcript,
    confidence,
    isSupported: voiceSupported,
    isListening,
    error: voiceError,
    permissionGranted,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: true, // Keep recording until manually stopped (toggle mode)
    interimResults: true,
    confidenceThreshold: 0.0, // Accept all confidence levels
    enableAudioFeedback: true
  }, actualRoomId)

  // Always sync transcript to input field for recording
  useEffect(() => {
    if (transcript) {
      onChange(transcript)
    }
  }, [transcript, onChange])

  // Update recording state when voice recognition state changes
  useEffect(() => {
    setIsRecording(isListening)
  }, [isListening])

  // Track processing and starting states for UI validation
  const isProcessing = voiceState === 'processing'
  const isStarting = voiceState === 'starting'

  // Auto-submit when recording stops and we have transcript
  useEffect(() => {
    if (shouldAutoSubmit && !isListening && !isRecording && voiceState !== 'processing') {
      // Use the input value (which should have the transcript) or the transcript itself
      const textToSubmit = value.trim() || transcript.trim()
      
      if (textToSubmit) {
        setShouldAutoSubmit(false)
        setTimeout(() => {
          handleSubmit()
        }, 100)
      } else {
        setShouldAutoSubmit(false)
      }
    }
  }, [shouldAutoSubmit, transcript, value, isListening, isRecording, voiceState])

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
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

  // Toggle recording event handler
  const handleMicToggle = async () => {
    if (!voiceSupported || disabled) return
    
    // If permission denied, just request permission (don't toggle recording)
    if (permissionGranted === false) {
      requestPermission()
      return
    }
    
    // Mark user gesture for Safari AudioContext
    if (BROWSER_INFO.isSafari) {
      audioFeedback.markUserGesture()
    }
    
    if (isRecording || isListening) {
      // Stop recording
      stopListening()
      setShouldAutoSubmit(true) // Mark for auto-submit when stopped
    } else {
      // Start recording - clear everything first to prevent duplicates
      resetTranscript()
      onChange('') // Clear input field
      
      // If permission not granted, request it first
      if (permissionGranted === false || permissionGranted === null) {
        const granted = await requestPermission()
        if (!granted) {
          return
        }
      }
      
      startListening()
    }
  }

  // Handle mic button click
  const handleMicClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleMicToggle()
  }

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleMicToggle()
    }
  }

  // Mic button styling based on state
  const getMicButtonStyle = () => {
    if (!voiceSupported) {
      return "bg-gray-800 cursor-not-allowed"
    }
    if (permissionGranted === false) {
      return "bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800"
    }
    if (isRecording || isListening) {
      return "bg-green-500 hover:bg-green-600 animate-pulse scale-110 shadow-lg shadow-green-500/50"
    }
    if (isStarting) {
      return "bg-orange-500 hover:bg-orange-600 scale-110 shadow-lg shadow-orange-500/50"
    }
    if (isProcessing) {
      return "bg-amber-500 hover:bg-amber-600 scale-110 shadow-lg shadow-amber-500/50"
    }
    return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
  }

  const getMicButtonTitle = () => {
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
    if (isRecording || isListening) {
      return BROWSER_INFO.isSafari
        ? "Recording... Click to stop and submit (Safari)"
        : "Recording... Click to stop and submit"
    }
    if (isStarting) {
      return BROWSER_INFO.isSafari
        ? "Starting microphone... Please wait (Safari)"
        : "Starting microphone... Please wait"
    }
    if (isProcessing) {
      return "Processing speech... Please wait"
    }
    if (permissionGranted === null) {
      return BROWSER_INFO.isSafari
        ? "Click to start recording (Safari will request microphone permission)"
        : "Click to start recording (will request microphone permission)"
    }
    return BROWSER_INFO.isSafari
      ? "Click to start recording (Safari)"
      : "Click to start recording"
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Push-to-Talk feedback area - always shown when voice is supported */}
      {voiceSupported && (isListening || transcript || voiceError) && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse' : 
                voiceState === 'starting' ? 'bg-orange-500 animate-pulse' :
                voiceState === 'processing' ? 'bg-amber-500 animate-pulse' :
                voiceState === 'error' ? 'bg-red-600' :
                'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-300">
                {isListening ? 'Recording... Click mic to stop' : 
                 voiceState === 'starting' ? 'Starting microphone...' :
                 voiceState === 'processing' ? 'Processing speech...' :
                 voiceState === 'error' ? 'Error' :
                 'Click-to-Talk ready'}
              </span>
            </div>
            {/* Voice Status Indicator */}
            <div className="text-xs text-gray-400">
              {permissionGranted === true ? '✓ Ready' : 
               permissionGranted === false ? '✗ Denied' : 
               '? Unknown'}
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
        {/* Mic toggle button */}
        <button
          onClick={handleMicClick}
          onKeyDown={handleKeyDown}
          disabled={disabled || !voiceSupported}
          className={`flex-shrink-0 w-12 h-12 ${getMicButtonStyle()} disabled:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200 relative select-none`}
          title={getMicButtonTitle()}
          tabIndex={0}
        >
          {(isRecording || isListening) ? (
            // Recording icon with pulse animation (green)
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
          ) : isStarting ? (
            // Starting spinner (orange)
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isProcessing ? (
            // Processing spinner (amber)
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
            placeholder={isListening ? 'Recording... (click mic to stop)' : isStarting ? 'Starting microphone...' : isProcessing ? 'Processing speech...' : placeholder}
            disabled={disabled}
            className={`w-full h-12 px-6 pr-16 bg-gray-800 border rounded-full text-white placeholder-gray-400 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
              isListening
                ? 'border-green-500 focus:border-green-400' 
                : isStarting
                  ? 'border-orange-500 focus:border-orange-400'
                  : isProcessing
                    ? 'border-amber-500 focus:border-amber-400'
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
            <p className="mt-1">Or click the microphone button to start recording (Click-to-Talk)</p>
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