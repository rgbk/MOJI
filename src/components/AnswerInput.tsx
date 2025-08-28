import { useState, useEffect } from 'react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'

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
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [voiceTranscript, setVoiceTranscript] = useState('')

  // Initialize voice recognition
  const {
    state: voiceState,
    transcript,
    confidence,
    isSupported: voiceSupported,
    isListening,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    confidenceThreshold: 0.6,
    enableAudioFeedback: true
  })

  // Handle voice input results
  useEffect(() => {
    if (transcript && voiceState === 'processing') {
      // Set the transcript as the input value
      onChange(transcript)
      setVoiceTranscript(transcript)
      
      // Auto-submit if confidence is high enough
      if (confidence > 0.8) {
        setTimeout(() => {
          onSubmit(transcript)
          resetTranscript()
          setVoiceTranscript('')
        }, 500)
      }
    }
  }, [transcript, voiceState, confidence, onChange, onSubmit, resetTranscript])

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
      if (inputMode === 'voice') {
        resetTranscript()
        setVoiceTranscript('')
      }
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

  const handleVoiceToggle = () => {
    if (!voiceSupported) return

    if (isListening) {
      stopListening()
    } else if (inputMode === 'voice') {
      startListening()
    } else {
      setInputMode('voice')
      onChange('')
      resetTranscript()
      setVoiceTranscript('')
      setTimeout(() => startListening(), 100)
    }
  }

  const handleTextModeSwitch = () => {
    if (isListening) {
      stopListening()
    }
    setInputMode('text')
    resetTranscript()
    setVoiceTranscript('')
  }

  // Voice button styling based on state
  const getVoiceButtonStyle = () => {
    if (!voiceSupported) {
      return "bg-gray-800 cursor-not-allowed"
    }
    if (isListening) {
      return "bg-red-500 hover:bg-red-600 animate-pulse"
    }
    if (inputMode === 'voice') {
      return "bg-blue-500 hover:bg-blue-600"
    }
    return "bg-gray-700 hover:bg-gray-600"
  }

  const getVoiceButtonTitle = () => {
    if (!voiceSupported) {
      return "Voice input not supported in this browser"
    }
    if (isListening) {
      return "Click to stop listening"
    }
    if (inputMode === 'voice') {
      return "Click to start voice input"
    }
    return "Switch to voice input"
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Voice feedback area */}
      {inputMode === 'voice' && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : voiceState === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-300">
                {isListening ? 'Listening...' : 
                 voiceState === 'processing' ? 'Processing...' :
                 voiceState === 'error' ? 'Error' :
                 'Ready for voice input'}
              </span>
            </div>
            <button
              onClick={handleTextModeSwitch}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Switch to typing
            </button>
          </div>
          
          {transcript && (
            <div className="text-sm text-white mb-2">
              <span className="text-gray-400">Heard: </span>
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
        {/* Voice input button */}
        <button
          onClick={handleVoiceToggle}
          disabled={disabled || !voiceSupported}
          className={`flex-shrink-0 w-12 h-12 ${getVoiceButtonStyle()} disabled:bg-gray-800 rounded-full flex items-center justify-center transition-colors duration-200 relative`}
          title={getVoiceButtonTitle()}
        >
          {isListening ? (
            // Listening icon (stop/pause)
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            // Microphone icon
            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
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
              if (inputMode === 'voice') {
                setInputMode('text')
                resetTranscript()
                setVoiceTranscript('')
              }
              onChange(e.target.value)
            }}
            onKeyPress={handleKeyPress}
            placeholder={inputMode === 'voice' ? 'Voice input active...' : placeholder}
            disabled={disabled || (inputMode === 'voice' && isListening)}
            className={`w-full h-12 px-6 pr-16 bg-gray-800 border rounded-full text-white placeholder-gray-400 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
              inputMode === 'voice' 
                ? 'border-blue-500 focus:border-blue-400' 
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
        {inputMode === 'voice' ? (
          <div>
            <p>Click the microphone to start listening</p>
            {voiceSupported && (
              <p className="mt-1">Speak clearly and answers will be submitted automatically</p>
            )}
          </div>
        ) : (
          <div>
            <p>Type your answer and press Enter or tap the arrow</p>
            {voiceSupported && (
              <p className="mt-1">Or click the microphone for voice input</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnswerInput