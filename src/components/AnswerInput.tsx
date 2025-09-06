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
    <div className="w-full max-w-md mx-auto">
      {/* Simple mic button only */}
      <div className="flex items-center justify-center space-x-4">
        {/* Mic button with text state */}
        <button
          onClick={handleMicClick}
          onKeyDown={handleKeyDown}
          disabled={disabled || !voiceSupported}
          className={`px-6 py-3 ${getMicButtonStyle()} disabled:bg-gray-800 rounded-full flex items-center space-x-2 transition-all duration-200 select-none`}
          title={getMicButtonTitle()}
          tabIndex={0}
        >
          {(isRecording || isListening) ? (
            <>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-white font-medium">STOP</span>
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-5 h-5 text-white" />
              <span className="text-white font-medium">READY</span>
            </>
          )}
        </button>

        {/* Hidden input for voice recognition */}
        <input
          type="hidden"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Show transcript only when recording or have text */}
      {(transcript || isListening) && (
        <div className="mt-3 text-center">
          <p className="text-white text-lg">
            {transcript || "Listening..."}
          </p>
        </div>
      )}

      {/* Only show critical errors */}
      {voiceError && (
        <div className="mt-2 text-center">
          <p className="text-red-400 text-xs">{voiceError}</p>
        </div>
      )}
    </div>
  )
}

export default AnswerInput