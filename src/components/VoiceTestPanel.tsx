import { useVoiceRecognition } from '../hooks/useVoiceRecognition'

/**
 * Simple test panel for voice recognition functionality
 * This component can be used for development and testing purposes
 */
export function VoiceTestPanel() {
  const {
    state,
    transcript,
    confidence,
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    confidenceThreshold: 0.5,
    enableAudioFeedback: true
  })

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="font-bold text-red-800 mb-2">Voice Recognition Not Supported</h3>
        <p className="text-red-700 text-sm">
          Your browser doesn't support the Web Speech API. Please try Chrome, Edge, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-white">
      <h3 className="font-bold mb-4">Voice Recognition Test Panel</h3>
      
      {/* Controls */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={startListening}
          disabled={isListening}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded"
        >
          Start Listening
        </button>
        <button
          onClick={stopListening}
          disabled={!isListening}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white rounded"
        >
          Stop Listening
        </button>
        <button
          onClick={resetTranscript}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Reset
        </button>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <strong>State:</strong> <span className="text-blue-400">{state}</span>
        </div>
        <div>
          <strong>Listening:</strong> <span className="text-blue-400">{isListening ? 'Yes' : 'No'}</span>
        </div>
        <div>
          <strong>Confidence:</strong> <span className="text-blue-400">{Math.round(confidence * 100)}%</span>
        </div>
        <div>
          <strong>Supported:</strong> <span className="text-blue-400">{isSupported ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Transcript */}
      <div className="mb-4">
        <strong>Transcript:</strong>
        <div className="mt-1 p-2 bg-gray-700 rounded border min-h-[60px]">
          {transcript || <span className="text-gray-400 italic">Nothing recognized yet...</span>}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-2 bg-red-900 border border-red-600 rounded text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p>This panel is for testing voice recognition functionality.</p>
        <p>Make sure to allow microphone permissions when prompted.</p>
      </div>
    </div>
  )
}

export default VoiceTestPanel