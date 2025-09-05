import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { BROWSER_INFO, SAFARI_LIMITATIONS, checkSafariRequirements } from '../utils/browserDetection'
import { audioFeedback } from '../lib/audio'

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
    permissionGranted,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    confidenceThreshold: 0.5,
    enableAudioFeedback: true
  })

  // Safari-specific diagnostic information
  const safariRequirements = BROWSER_INFO.isSafari ? checkSafariRequirements(BROWSER_INFO) : null
  const audioStatus = BROWSER_INFO.isSafari ? audioFeedback.getSafariStatus() : null

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
      <h3 className="font-bold mb-4 flex items-center">
        Voice Recognition Test Panel
        {BROWSER_INFO.isSafari && (
          <span className="ml-2 px-2 py-1 text-xs bg-orange-600 rounded">Safari</span>
        )}
      </h3>
      
      {/* Safari-specific warnings */}
      {BROWSER_INFO.isSafari && safariRequirements?.issues.length > 0 && (
        <div className="mb-4 p-3 bg-orange-900 border border-orange-600 rounded">
          <strong className="text-orange-300">Safari Issues Detected:</strong>
          <ul className="mt-1 text-sm text-orange-200">
            {safariRequirements.issues.map((issue, index) => (
              <li key={index} className="list-disc list-inside">• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
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
        {permissionGranted === false && (
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
          >
            Request Permission
          </button>
        )}
      </div>

      {/* Basic Status */}
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
        <div>
          <strong>Permission:</strong> 
          <span className={`ml-1 ${
            permissionGranted === true ? 'text-green-400' :
            permissionGranted === false ? 'text-red-400' :
            'text-yellow-400'
          }`}>
            {permissionGranted === true ? 'Granted' :
             permissionGranted === false ? 'Denied' :
             'Unknown'}
          </span>
        </div>
        <div>
          <strong>Browser:</strong> 
          <span className="text-blue-400 ml-1">
            {BROWSER_INFO.isSafariMobile ? 'Safari Mobile' :
             BROWSER_INFO.isSafariDesktop ? 'Safari Desktop' :
             BROWSER_INFO.isWebKit ? 'WebKit' :
             'Other'}
            {BROWSER_INFO.safariVersion && ` v${BROWSER_INFO.safariVersion}`}
          </span>
        </div>
      </div>

      {/* Safari-specific diagnostics */}
      {BROWSER_INFO.isSafari && (
        <div className="mb-4 p-3 bg-gray-700 rounded border">
          <strong className="text-orange-300">Safari Diagnostics:</strong>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Secure Context:</strong> 
              <span className={`ml-1 ${safariRequirements?.isSecureContext ? 'text-green-400' : 'text-red-400'}`}>
                {safariRequirements?.isSecureContext ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <strong>Web Speech:</strong> 
              <span className={`ml-1 ${safariRequirements?.canUseWebSpeech ? 'text-green-400' : 'text-red-400'}`}>
                {safariRequirements?.canUseWebSpeech ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div>
              <strong>Web Audio:</strong> 
              <span className={`ml-1 ${safariRequirements?.canUseWebAudio ? 'text-green-400' : 'text-red-400'}`}>
                {safariRequirements?.canUseWebAudio ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div>
              <strong>MediaDevices:</strong> 
              <span className={`ml-1 ${BROWSER_INFO.supportsMediaDevices ? 'text-green-400' : 'text-red-400'}`}>
                {BROWSER_INFO.supportsMediaDevices ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {audioStatus && (
              <>
                <div>
                  <strong>Audio Gesture:</strong> 
                  <span className={`ml-1 ${audioStatus.hasUserGesture ? 'text-green-400' : 'text-yellow-400'}`}>
                    {audioStatus.hasUserGesture ? 'Received' : 'Needed'}
                  </span>
                </div>
                <div>
                  <strong>Audio Context:</strong> 
                  <span className={`ml-1 ${
                    audioStatus.contextState === 'running' ? 'text-green-400' :
                    audioStatus.contextState === 'suspended' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {audioStatus.contextState || 'None'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
          {BROWSER_INFO.isSafari && (
            <div className="mt-1 text-xs text-red-200">
              Check the browser console for detailed Safari debugging information.
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p>This panel is for testing voice recognition functionality.</p>
        {BROWSER_INFO.isSafari ? (
          <p>Safari-specific debugging is enabled. Check browser console for detailed logs.</p>
        ) : (
          <p>Make sure to allow microphone permissions when prompted.</p>
        )}
      </div>
    </div>
  )
}

export default VoiceTestPanel